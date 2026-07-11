/**
 * Stripe helper — server-side only.
 * Uses the stripe npm package for type safety and webhook verification.
 */
import Stripe from "stripe";

// Lazy singleton — only instantiated on first use (server-side)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return _stripe;
}

export async function createStripeSession(params: {
  bookingId: string;
  reference: string;
  items: { name: string; unitAmount: number; quantity: number }[];
  deliveryFee: number;
  appUrl: string;
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  const stripe = getStripe();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    ...params.items.map((item) => ({
      price_data: {
        currency: "gbp" as const,
        product_data: { name: item.name },
        unit_amount: Math.round(item.unitAmount * 100),
      },
      quantity: item.quantity,
    })),
    ...(params.deliveryFee > 0
      ? [
          {
            price_data: {
              currency: "gbp" as const,
              product_data: { name: "Delivery" },
              unit_amount: Math.round(params.deliveryFee * 100),
            },
            quantity: 1,
          },
        ]
      : []),
  ];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    metadata: {
      bookingId: params.bookingId,
      reference: params.reference,
    },
    success_url: `${params.appUrl}/confirmation/${params.reference}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.appUrl}/payment`,
    payment_intent_data: {
      metadata: { bookingId: params.bookingId },
    },
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url!,
  };
}
