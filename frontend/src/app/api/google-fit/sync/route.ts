import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleHealthAggregate } from "@/lib/google-health-aggregate";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const accessToken = String(payload?.accessToken ?? "").trim();

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken is required" }, { status: 400 });
  }

  const end = Date.now();
  const start = end - 7 * 24 * 60 * 60 * 1000;

  try {
    const { metrics, raw } = await fetchGoogleHealthAggregate(accessToken, start, end);
    return NextResponse.json({ synced: true, provider: "google-fit", metrics, raw });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown sync failure";
    return NextResponse.json(
      { error: "Google Fit sync failed", detail: detail.slice(0, 400) },
      { status: 502 },
    );
  }
}
