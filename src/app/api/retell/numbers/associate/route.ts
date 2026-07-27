import { NextRequest, NextResponse } from 'next/server';
import { associatePhoneNumberWithAgent } from '@/lib/retell-api';
import { updateMockNumberAgent } from '@/lib/telnyx-api';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, agentId } = body;

    if (!phoneNumber || !agentId) {
      return NextResponse.json(
        { message: 'phoneNumber and agentId are required' },
        { status: 400 }
      );
    }

    const result = await associatePhoneNumberWithAgent(phoneNumber, agentId);
    updateMockNumberAgent(phoneNumber, agentId);

    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from('phone_numbers')
        .update({ retell_agent_id: agentId, updated_at: new Date().toISOString() })
        .eq('phone_number', phoneNumber);
    } catch (e) {
      console.warn('[DB Agent Association Warning]', e);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /retell/numbers/associate Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to associate phone number with agent' },
      { status: 500 }
    );
  }
}
