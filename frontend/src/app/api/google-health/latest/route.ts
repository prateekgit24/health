import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { getGoogleHealthSnapshot } from "@/lib/google-health-store";

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await getGoogleHealthSnapshot(user.uid);
    return NextResponse.json({ snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch Google Health snapshot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
