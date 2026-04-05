import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { createGoogleHealthOAuthState } from "@/lib/google-health-store";

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ connected: false, message: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID ?? process.env.GOOGLE_FIT_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_HEALTH_REDIRECT_URI ?? process.env.GOOGLE_FIT_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        connected: false,
        message: "Google Health env vars are missing. Set GOOGLE_HEALTH_CLIENT_ID and GOOGLE_HEALTH_REDIRECT_URI.",
      },
      { status: 400 },
    );
  }

  const state = await createGoogleHealthOAuthState(user.uid);
  const scope = encodeURIComponent("https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.location.read");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&access_type=offline&prompt=consent&scope=${scope}&state=${encodeURIComponent(state)}`;

  return NextResponse.json({ connected: true, authUrl, provider: "google-health" });
}
