import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/profile-store";
import { calculateNutritionRequirements } from "@/lib/nutrition-requirements";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id") || user.uid;

  const profile = await getProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const requirements = calculateNutritionRequirements(profile);
  return NextResponse.json({ requirements });
}
