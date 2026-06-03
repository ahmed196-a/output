import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/checkout
 * Body: { priceId; planId; planName }
 *
 * Creates a Stripe Checkout session.
 * For guests:
 *   On success → /auth/register?session_id={CHECKOUT_SESSION_ID}&plan_id={planId}&plan_name={planName}
 *   On cancel  → /pricing
 * For logged-in users:
 *   On success → /dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}&plan_id={planId}&plan_name={planName}
 *   On cancel  → /dashboard
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

    // Check if user is logged in
    const payload = await verifyRequestJwt(req);
    const isLoggedIn = !!payload;

    const metadata: Record<string, string> = {
      plan_id: planId,
      plan_name: planName,
    };

    if (isLoggedIn && payload.sub) {
      metadata.user_id = payload.sub;
    }

    const successUrl = isLoggedIn
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&plan_name=${encodeURIComponent(planName)}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}&plan_name=${encodeURIComponent(planName)}`;

    const cancelUrl = isLoggedIn
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      : `${process.env.NEXT_PUBLIC_APP_URL}/pricing`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}