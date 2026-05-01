import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/checkout
 * Body: { priceId: string; planId: string; planName: string }
 *
 * Creates a Stripe Checkout session.
 * On success → /auth/register?session_id={CHECKOUT_SESSION_ID}&plan_id={planId}&plan_name={planName}
 * On cancel  → /pricing
 */
export async function POST(req: NextRequest) {
  try {
    const { priceId, planId, planName } = await req.json();

    if (!priceId || !planId || !planName) {
      return NextResponse.json(
        { error: "priceId, planId, and planName are required." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        plan_id: planId,
        plan_name: planName,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&plan_name=${encodeURIComponent(planName)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}