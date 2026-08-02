/**
 * SumUp Checkout API helper.
 * Docs: https://developer.sumup.com/api/checkouts
 */

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

export interface SumUpCheckout {
  id: string;
  status: string;
  amount: number;
  currency: string;
  checkout_reference: string;
}

function getSumUpApiConfig() {
  const apiKey = process.env.SUMUP_API_KEY;
  const merchantEmail = process.env.SUMUP_MERCHANT_EMAIL;

  if (!apiKey || !merchantEmail) {
    throw new Error("SumUp credentials not configured");
  }

  return { apiKey, merchantEmail };
}

export async function createSumUpCheckout(params: {
  reference: string;
  amount: number;
  description: string;
  returnUrl: string;
  redirectUrl: string;
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const { apiKey, merchantEmail } = getSumUpApiConfig();

  const res = await fetch(`${SUMUP_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: params.reference,
      amount: params.amount,
      currency: "GBP",
      pay_to_email: merchantEmail,
      description: params.description,
      return_url: params.returnUrl,
      redirect_url: params.redirectUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `SumUp error ${res.status}`
    );
  }

  const checkout: SumUpCheckout = await res.json();
  return {
    checkoutId: checkout.id,
    checkoutUrl: `https://checkout.sumup.com/pay/${checkout.id}`,
  };
}

export async function getSumUpCheckout(checkoutId: string): Promise<SumUpCheckout> {
  const { apiKey } = getSumUpApiConfig();

  const res = await fetch(`${SUMUP_API_BASE}/checkouts/${checkoutId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `SumUp error ${res.status}`
    );
  }

  return res.json();
}
