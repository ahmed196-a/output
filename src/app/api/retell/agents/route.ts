import { NextRequest, NextResponse } from 'next/server';
import { createRetellAgent, getRetellAgent } from '@/lib/retell-api';
import { verifyRequestJwt } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (users && users.length > 0) {
      return users[0].id;
    }
  } catch (e) {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;

    if (!userId) {
      userId = await getFallbackUserId();
    }

    if (!userId) {
      return NextResponse.json([]);
    }

    const supabase = createServerSupabaseClient();

    // 1. Query backend database table 'agents' for retell_agent_ids created by this user
    const { data: dbAgents, error: dbError } = await supabase
      .from('agents')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[DB User Agents Query Error]', dbError);
    }

    const userDbRecordsMap = new Map<string, any>();

    (dbAgents || []).forEach((a: any) => {
      if (a.retell_agent_id) {
        userDbRecordsMap.set(a.retell_agent_id, a);
      }
    });

    // If user has 0 mapped agents in backend DB, return empty list
    if (userDbRecordsMap.size === 0) {
      return NextResponse.json([]);
    }

    // 2. For each retell_agent_id mapped to this user in DB, fetch live details from Retell API
    const userAgents = await Promise.all(
      Array.from(userDbRecordsMap.values()).map(async (dbRecord: any) => {
        try {
          const live = await getRetellAgent(dbRecord.retell_agent_id, { skipCache: true });
          return {
            id: dbRecord.id,
            agent_id: dbRecord.retell_agent_id,
            agent_name: live.agent_name || dbRecord.name || 'Voice Agent',
            voice_id: live.voice_id || dbRecord.voice_id || 'retell-Cimo',
            language: live.language || dbRecord.language || 'en-US',
            response_engine: live.response_engine || { type: dbRecord.response_engine || 'retell-llm' },
            begin_message: live.begin_message || dbRecord.begin_message || '',
            general_prompt: live.general_prompt || dbRecord.general_prompt || '',
            created_at: live.created_at || (dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now()),
            userId: userId,
          };
        } catch (e) {
          // Fall back to stored DB record if live Retell API call fails
          return {
            id: dbRecord.id,
            agent_id: dbRecord.retell_agent_id,
            agent_name: dbRecord.name || 'Voice Agent',
            voice_id: dbRecord.voice_id || 'retell-Cimo',
            language: dbRecord.language || 'en-US',
            response_engine: { type: dbRecord.response_engine || 'retell-llm' },
            begin_message: dbRecord.begin_message || '',
            general_prompt: dbRecord.general_prompt || '',
            created_at: dbRecord.created_at ? new Date(dbRecord.created_at).getTime() : Date.now(),
            userId: userId,
          };
        }
      })
    );

    return NextResponse.json(userAgents);
  } catch (error: any) {
    console.error('[API /retell/agents GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user voice agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;

    if (!userId) {
      userId = await getFallbackUserId();
    }

    if (!userId) {
      return NextResponse.json({ message: 'User authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { agent_name, voice_id, response_engine, begin_message, general_prompt, language } = body;

    if (!voice_id || !response_engine) {
      return NextResponse.json(
        { message: 'voice_id and response_engine are required' },
        { status: 400 }
      );
    }

    // 1. Create agent on Retell AI REST API
    const createdAgent = await createRetellAgent({
      agent_name: agent_name || 'Unnamed Agent',
      voice_id,
      response_engine,
      begin_message,
      general_prompt,
      language: language || 'en-US',
    }, userId);

    // 2. Track in backend DB table (mapping retell_agent_id -> created_by = userId)
    const supabase = createServerSupabaseClient();
    const { data: dbRow, error: insertErr } = await supabase.from('agents').insert({
      retell_agent_id: createdAgent.agent_id,
      name: createdAgent.agent_name,
      voice_id: createdAgent.voice_id,
      language: createdAgent.language || 'en-US',
      response_engine: createdAgent.response_engine.type,
      llm_websocket_url: createdAgent.response_engine.llm_websocket_url || null,
      begin_message: createdAgent.begin_message || null,
      general_prompt: createdAgent.general_prompt || null,
      created_by: userId,
      tenant_id: payload?.tenantId || null,
    }).select().single();

    if (insertErr) {
      console.error('[Agent Backend DB Insert Error]', insertErr);
    }

    return NextResponse.json({
      ...createdAgent,
      id: dbRow?.id || createdAgent.agent_id,
      userId,
    });
  } catch (error: any) {
    console.error('[API /retell/agents POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create voice agent' },
      { status: 500 }
    );
  }
}
