interface CallbackPageProps {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
    state?: string;
  }>;
}

export default async function SumUpOAuthCallbackPage({
  searchParams,
}: CallbackPageProps) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";
  const error = typeof params.error === "string" ? params.error : "";
  const errorDescription =
    typeof params.error_description === "string"
      ? params.error_description
      : "";
  const state = typeof params.state === "string" ? params.state : "";

  const title = error
    ? "SumUp connection failed"
    : code
      ? "SumUp callback received"
      : "Waiting for SumUp callback";

  const message = error
    ? errorDescription || error
    : code
      ? "Authorization data reached your app and the backend attempted the token exchange. If no error is shown here, the access token was stored server-side."
      : "This page displays the result of the SumUp OAuth callback. Register the API callback route as the fixed redirect URI when configuring a web client.";

  return (
    <main className="min-h-screen bg-brand-black px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-surface-border bg-surface-dark/80 p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
            SumUp OAuth Callback
          </p>
          <h1 className="text-3xl font-black">{title}</h1>
          <p className="text-sm text-gray-400">{message}</p>
        </div>

        <div className="space-y-3 text-sm text-gray-300">
          <div className="rounded-2xl border border-surface-border bg-brand-black/50 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
              Fixed OAuth redirect URI
            </p>
            <p className="mt-2 font-mono break-all">/api/sumup/oauth/callback</p>
          </div>

          <div className="rounded-2xl border border-surface-border bg-brand-black/50 p-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
              Callback data
            </p>
            <p>
              <span className="text-gray-500">code:</span>{" "}
              <span className="font-mono break-all">{code || "not provided"}</span>
            </p>
            <p>
              <span className="text-gray-500">state:</span>{" "}
              <span className="font-mono break-all">{state || "not provided"}</span>
            </p>
            <p>
              <span className="text-gray-500">error:</span>{" "}
              <span className="font-mono break-all">{error || "not provided"}</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}