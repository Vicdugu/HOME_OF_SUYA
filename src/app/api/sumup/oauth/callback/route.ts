import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { storeSumUpToken } from "@/lib/sumup-auth";

function buildRedirectUrl(req: NextRequest, search: URLSearchParams) {
  const redirectUrl = new URL("/sumup/oauth/callback", req.url);
  for (const [key, value] of search.entries()) {
    redirectUrl.searchParams.set(key, value);
  }
  return redirectUrl;
}

export async function GET(req: NextRequest) {
  const redirectUrl = buildRedirectUrl(req, req.nextUrl.searchParams);
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const redirectUri = process.env.SUMUP_OAUTH_REDIRECT_URI;
  const clientId = process.env.SUMUP_CLIENT_ID;
  const clientSecret = process.env.SUMUP_CLIENT_SECRET;

  if (!code && !error) {
    redirectUrl.searchParams.set(
      "error",
      "missing_callback_data"
    );
    redirectUrl.searchParams.set(
      "error_description",
      "SumUp did not return an authorization code or an error."
    );
  }

  if (code && !error) {
    if (!redirectUri || !clientId || !clientSecret) {
      redirectUrl.searchParams.set("error", "sumup_oauth_not_configured");
      redirectUrl.searchParams.set(
        "error_description",
        "SUMUP_CLIENT_ID, SUMUP_CLIENT_SECRET, and SUMUP_OAUTH_REDIRECT_URI must be configured before exchanging the authorization code."
      );
      return NextResponse.redirect(redirectUrl);
    }

    const tokenResponse = await fetch("https://api.sumup.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: "no-store",
    });

    const tokenData = await tokenResponse.json().catch(() => null) as {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      scope?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    } | null;

    if (!tokenResponse.ok || !tokenData?.access_token) {
      redirectUrl.searchParams.set(
        "error",
        tokenData?.error || "token_exchange_failed"
      );
      redirectUrl.searchParams.set(
        "error_description",
        tokenData?.error_description || `Token exchange failed with status ${tokenResponse.status}.`
      );
      return NextResponse.redirect(redirectUrl);
    }

    await storeSumUpToken({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      expiresIn: tokenData.expires_in,
    });
  }

  return NextResponse.redirect(redirectUrl);
}