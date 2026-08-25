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
  const accessToken = storedToken?.accessToken ?? apiKey;

  if (!accessToken || (!merchantCode && !merchantEmail)) {
    throw new Error(
      `[sumup-debug-v2] SumUp credentials not configured (accessToken=${accessToken ? "present" : "missing"}, apiKey=${apiKey ? "present" : "missing"}, merchantCode=${merchantCode ? "present" : "missing"}, merchantEmail=${merchantEmail ? "present" : "missing"}, cwd=${process.cwd()}, envPath=${envPath}, envFileExists=${existsSync(envPath) ? "yes" : "no"}, envFileKeys=${Object.keys(envFileValues).filter((key) => key.startsWith("SUMUP_")).join(",") || "none"})`
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
