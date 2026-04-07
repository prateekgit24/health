import { NextRequest, NextResponse } from "next/server";
import { consumeGoogleHealthOAuthState, saveGoogleHealthSnapshot, saveGoogleHealthRefreshToken } from "@/lib/google-health-store";
import { fetchGoogleHealthAggregate } from "@/lib/google-health-aggregate";

function htmlPage(title: string, message: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        background: radial-gradient(circle at 10% 5%, #155e63 0%, #072627 40%, #031212 100%);
        color: #ecfdf5;
        min-height: 100vh;
        display: grid;
        place-items: center;
      }
      main {
        width: min(680px, 92vw);
        background: rgba(6, 78, 59, 0.28);
        border: 1px solid rgba(167, 243, 208, 0.22);
        border-radius: 18px;
        padding: 24px;
      }
      h1 { margin: 0 0 10px; font-size: 1.35rem; }
      p { margin: 0; line-height: 1.55; color: rgba(236, 253, 245, 0.9); }
      .hint { margin-top: 14px; font-size: 0.92rem; color: rgba(236, 253, 245, 0.75); }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
      <p class="hint">You can close this tab and return to your profile.</p>
    </main>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (oauthError) {
    return new NextResponse(
      htmlPage("Google Health Connection Failed", `OAuth error: ${oauthError}`),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  if (!code) {
    return new NextResponse(
      htmlPage("Google Health Connection Failed", "Missing authorization code in callback URL."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  if (!state) {
    return new NextResponse(
      htmlPage("Google Health Connection Failed", "Missing OAuth state. Start the flow from the app and try again."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const uid = await consumeGoogleHealthOAuthState(state);
  if (!uid) {
    return new NextResponse(
      htmlPage("Google Health Connection Failed", "OAuth state is invalid or expired. Start connect flow again from your profile."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse(
      htmlPage(
        "Google Health Connection Failed",
        "Missing Google Health env vars. Set GOOGLE_HEALTH_CLIENT_ID, GOOGLE_HEALTH_CLIENT_SECRET, and GOOGLE_HEALTH_REDIRECT_URI.",
      ),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const detail = (await tokenResponse.text()).slice(0, 300);
    return new NextResponse(
      htmlPage("Google Health Connection Failed", `Token exchange failed. ${detail}`),
      { status: tokenResponse.status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string; refresh_token?: string };
  if (!tokenData.access_token) {
    return new NextResponse(
      htmlPage("Google Health Connection Failed", "Token exchange succeeded but no access token was returned."),
      { status: 502, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  if (tokenData.refresh_token) {
    await saveGoogleHealthRefreshToken(uid, tokenData.refresh_token);
  }

  const end = Date.now();
  const start = end - 7 * 24 * 60 * 60 * 1000;

  let aggregateResult: Awaited<ReturnType<typeof fetchGoogleHealthAggregate>>;
  try {
    aggregateResult = await fetchGoogleHealthAggregate(tokenData.access_token, start, end);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown aggregate error";
    return new NextResponse(
      htmlPage(
        "Google Health Connected, But Sync Failed",
        `Authorization worked, but the first fitness sync failed. ${detail}`,
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }
  const { metrics, raw } = aggregateResult;

  await saveGoogleHealthSnapshot({
    uid,
    syncedAt: metrics.syncedAt,
    startTimeMillis: metrics.startTimeMillis,
    endTimeMillis: metrics.endTimeMillis,
    steps: metrics.steps,
    caloriesKcal: metrics.caloriesKcal,
    distanceMeters: metrics.distanceMeters,
    activeMinutes: metrics.activeMinutes,
    heartMinutes: metrics.heartMinutes,
    confidence: metrics.confidence,
    dailyBuckets: metrics.dailyBuckets,
    raw,
  });

  return new NextResponse(
    htmlPage(
      "Google Health Connected",
      `Data saved. Steps: ${metrics.steps.toLocaleString()}, Calories: ${Math.round(metrics.caloriesKcal).toLocaleString()} kcal, Distance: ${Math.round(metrics.distanceMeters).toLocaleString()} m.`,
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
