import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { deleteGoogleHealthData, getGoogleHealthRefreshToken } from "@/lib/google-health-store";

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refreshToken = await getGoogleHealthRefreshToken(user.uid);

    // If we possess a refresh token, politely tell Google to revoke it
    if (refreshToken) {
      await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken }).toString(),
      }).catch((e) => console.error("Google Revoke Failed:", e));
    }

    // Now completely wipe our database records (auto-forgetting)
    await deleteGoogleHealthData(user.uid);

    return NextResponse.json({ disconnected: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cleanly disconnect Google Health" },
      { status: 500 },
    );
  }
}
