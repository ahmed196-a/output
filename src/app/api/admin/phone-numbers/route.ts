import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestJwt, requireRole } from '@/lib/jwt-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getPurchasedNumbers } from '@/lib/telnyx-api';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !requireRole(payload, ['super_admin', 'admin', 'operations'])) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    try {
      const supabase = createServerSupabaseClient();
      const { data: dbNumbers, error } = await supabase
        .from('phone_numbers')
        .select(`
          id,
          phone_number,
          country_code,
          type,
          capabilities,
          status,
          retell_agent_id,
          created_at,
          user_id,
          users:user_id (id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (!error && dbNumbers) {
        const mapped = dbNumbers.map((n: any) => ({
          id: n.id,
          phoneNumber: n.phone_number,
          status: n.status,
          countryCode: n.country_code,
          type: n.type || 'local',
          capabilities: n.capabilities ? Object.keys(n.capabilities) : ['voice', 'sms'],
          purchasedAt: n.created_at,
          agentId: n.retell_agent_id || undefined,
          userId: n.user_id,
          userEmail: n.users?.email || (n.user_id ? 'Unknown User' : 'Unassigned / Free Number'),
          userName: n.users?.full_name || (n.user_id ? 'System User' : 'Unassigned'),
        }));
        return NextResponse.json(mapped);
      }
    } catch (e) {
      console.warn('[Admin Phone Numbers DB Fetch Error]', e);
    }

    const fallbackNumbers = await getPurchasedNumbers();
    return NextResponse.json(fallbackNumbers);
  } catch (error: any) {
    console.error('[API /admin/phone-numbers GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch admin phone numbers' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await verifyRequestJwt(req);
    if (!payload || !requireRole(payload, ['super_admin', 'admin', 'operations'])) {
      return NextResponse.json({ message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { phoneNumberId, targetUserId } = body;

    if (!phoneNumberId) {
      return NextResponse.json(
        { message: 'phoneNumberId is required' },
        { status: 400 }
      );
    }

    const finalUserId = (!targetUserId || targetUserId === 'unassigned') ? null : targetUserId;

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('phone_numbers')
      .update({ user_id: finalUserId, updated_at: new Date().toISOString() })
      .or(`id.eq.${phoneNumberId},phone_number.eq.${phoneNumberId}`);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: finalUserId ? 'Phone number reassigned successfully.' : 'Phone number freed / unassigned successfully.',
    });
  } catch (error: any) {
    console.error('[API /admin/phone-numbers PATCH Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to reassign phone number' },
      { status: 500 }
    );
  }
}
