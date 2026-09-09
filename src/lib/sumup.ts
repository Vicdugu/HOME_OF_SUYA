/**
 * SumUp Checkout API helper.
 * Docs: https://developer.sumup.com/api/checkouts
 */

import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getStoredSumUpToken } from "@/lib/sumup-auth";

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

let envFileCache: Record<string, string> | null = null;

function loadEnvFileValues() {
  if (envFileCache) {
    return envFileCache;
  }

  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    envFileCache = {};
    return envFileCache;
  }

  const values: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  envFileCache = values;
  return values;
}

export interface SumUpCheckout {
  id: string;
  status: string;
  amount: number;
  currency: string;
  checkout_reference: string;
  hosted_checkout_url?: string;
}

async function getSumUpApiConfig() {
  const envPath = join(process.cwd(), ".env");
  const envFileValues = loadEnvFileValues();
  const storedToken = await getStoredSumUpToken();
  const apiKey = process.env.SUMUP_API_KEY ?? envFileValues.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE ?? envFileValues.SUMUP_MERCHANT_CODE;
  const merchantEmail = process.env.SUMUP_MERCHANT_EMAIL ?? envFileValues.SUMUP_MERCHANT_EMAIL;

  // Check if stored token exists and is still valid (not expired)
  let accessToken: string | undefined;
  if (storedToken?.expiresAt) {
    const now = Date.now();
    const expiresAt = new Date(storedToken.expiresAt).getTime();
    const tokenExpiresSoon = expiresAt - now < 5 * 60 * 1000; // Less than 5 minutes

    if (tokenExpiresSoon) {
      console.warn(
        "[SumUp] OAuth token expiring soon. Falling back to API key."
      );
      accessToken = apiKey;
    } else {
      // Token is still valid, use it
      accessToken = storedToken.accessToken;
    }
  } else if (storedToken?.accessToken) {
    // Token exists but no expiration info, use it cautiously
    accessToken = storedToken.accessToken;
  } else {
    // No stored token, use API key
    accessToken = apiKey;
  }

  // Final fallback to API key if OAuth token is unavailable
  if (!accessToken) {
    accessToken = apiKey;
  }

  if (!accessToken || (!merchantCode && !merchantEmail)) {
    throw new Error(
      "SumUp credentials not configured. Please check your environment variables."
    );
  }

  return { accessToken, merchantCode, merchantEmail };
}

export async function createSumUpCheckout(params: {
  reference: string;
  amount: number;
  description: string;
  returnUrl: string;
  redirectUrl: string;
}): Promise<{ checkoutId: string; checkoutUrl: string }> {
  const { accessToken, merchantCode, merchantEmail } = await getSumUpApiConfig();

  const res = await fetch(`${SUMUP_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: params.reference,
      amount: params.amount,
      currency: "GBP",
      ...(merchantCode ? { merchant_code: merchantCode } : { pay_to_email: merchantEmail }),
      description: params.description,
      return_url: params.returnUrl,
      redirect_url: params.redirectUrl,
      hosted_checkout: {
        enabled: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `SumUp error ${res.status}`
    );
  }

  const checkout: SumUpCheckout = await res.json();

  if (!checkout.hosted_checkout_url) {
    throw new Error("SumUp hosted checkout URL was not returned");
  }

  return {
    checkoutId: checkout.id,
    checkoutUrl: checkout.hosted_checkout_url,
  };
}

export async function getSumUpCheckout(checkoutId: string): Promise<SumUpCheckout> {
  const { accessToken } = await getSumUpApiConfig();

  const res = await fetch(`${SUMUP_API_BASE}/checkouts/${checkoutId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
