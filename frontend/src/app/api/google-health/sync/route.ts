import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleHealthAggregate } from "@/lib/google-health-aggregate";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { getGoogleHealthRefreshToken, saveGoogleHealthSnapshot } from "@/lib/google-health-store";

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refreshToken = await getGoogleHealthRefreshToken(user.uid);
    if (!refreshToken) {
      return NextResponse.json({ error: "No Google Health refresh token found. Please connect your account again." }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
    }

    // Exchange refresh token for a new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Google Health API session expired. Please connect again." }, { status: 401 });
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Failed to retrieve access token from Google." }, { status: 502 });
    }

    const end = Date.now();
    const start = end - 7 * 24 * 60 * 60 * 1000;

    const { metrics, raw } = await fetchGoogleHealthAggregate(tokenData.access_token, start, end);

    const snapshot = {
      uid: user.uid,
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
    };

    await saveGoogleHealthSnapshot(snapshot);

    return NextResponse.json({ synced: true, snapshot });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown sync failure";
    return NextResponse.json(
      { error: "Google Health sync failed", detail: detail.slice(0, 400) },
      { status: 502 },
    );
  }
}
