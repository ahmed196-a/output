import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getPurchasedNumbers, isTelnyxConfigured } from '@/lib/telnyx-api';

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

    // Fallback to mock active numbers in Sandbox/Development mode
    if (!isTelnyxConfigured()) {
      const mockNumbersList = await getPurchasedNumbers();
      return NextResponse.json(mockNumbersList);
    }

    if (userId) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: dbNumbers, error } = await supabase
          .from('phone_numbers')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && dbNumbers) {
          const userNumbers = dbNumbers.map((n: any) => ({
            id: n.id,
            phoneNumber: n.phone_number,
            status: n.status,
            countryCode: n.country_code,
            type: n.type || 'local',
            capabilities: n.capabilities ? Object.keys(n.capabilities) : ['voice', 'sms'],
            purchasedAt: n.created_at,
            agentId: n.retell_agent_id || undefined,
            userId: n.user_id,
          }));
          return NextResponse.json(userNumbers);
        }
      } catch (e) {
        console.warn('[Numbers DB Query Warning]', e);
      }
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('[API /telnyx/numbers Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user phone numbers' },
      { status: 500 }
    );
  }
}
