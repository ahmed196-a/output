import { NextRequest, NextResponse } from 'next/server';
import { createNumberOrder } from '@/lib/telnyx-api';
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

    if (userId) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: dbOrders, error } = await supabase
          .from('phone_orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && dbOrders) {
          const userOrders = dbOrders.map((o: any) => ({
            id: o.order_id,
            status: o.status,
            createdAt: o.created_at,
            phoneNumbers: [o.phone_number],
            requirementsMet: o.requirements_met,
            subOrderIds: o.sub_order_ids || [],
            customerReference: o.customer_reference,
            userId: o.user_id,
          }));
          return NextResponse.json(userOrders);
        }
      } catch (e) {
        console.warn('[Orders DB Query Warning]', e);
      }
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('[API /telnyx/orders GET Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch orders' },
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

    const body = await req.json();
    const { phoneNumber, customerReference } = body;

    if (!phoneNumber) {
      return NextResponse.json({ message: 'phoneNumber is required' }, { status: 400 });
    }

    const order = await createNumberOrder(phoneNumber, customerReference);

    if (userId) {
      try {
        const supabase = createServerSupabaseClient();
        await supabase.from('phone_orders').insert({
          user_id: userId,
          order_id: order.id,
          status: order.status,
          phone_number: phoneNumber,
          customer_reference: customerReference || 'WEB_PORTAL',
          requirements_met: order.requirementsMet,
          sub_order_ids: order.subOrderIds || [],
        });
      } catch (e) {
        console.warn('[Orders DB Insert Warning]', e);
      }
    }

    return NextResponse.json({ ...order, userId });
  } catch (error: any) {
    console.error('[API /telnyx/orders POST Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
