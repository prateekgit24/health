import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { deleteMealLog, getDailyMeals, logMeal } from "@/lib/meal-logger-store";
import { randomUUID } from "node:crypto";

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("dateStr"); // YYYY-MM-DD
  if (!dateStr) return NextResponse.json({ error: "dateStr required" }, { status: 400 });

  try {
    const logs = await getDailyMeals(user.uid, dateStr);
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch meal logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { dateStr, foodSlug, foodName, calories, protein, carbs, fat, servings } = body;

    if (!dateStr || !foodSlug || !foodName || typeof calories !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const newLog = {
      id: randomUUID(),
      uid: user.uid,
      dateStr,
      foodSlug,
      foodName,
      calories,
      protein,
      carbs,
      fat,
      servings,
      loggedAtMillis: Date.now(),
    };

    await logMeal(newLog);

    return NextResponse.json({ success: true, log: newLog });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save meal log" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    await deleteMealLog(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete meal log" }, { status: 500 });
  }
}
