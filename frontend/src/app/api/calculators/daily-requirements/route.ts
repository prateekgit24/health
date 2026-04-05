import { NextRequest, NextResponse } from "next/server";
import { calculateNutritionRequirements } from "@/lib/nutrition-requirements";
import type { ActivityLevel, DietPreference, GoalType, UserProfile } from "@/lib/profile-types";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const age = Number(payload?.age ?? 26);
  const heightCm = Number(payload?.heightCm ?? 170);
  const weightKg = Number(payload?.weightKg ?? 70);
  const weeklyWorkoutDays = Number(payload?.weeklyWorkoutDays ?? 3);

  if (!Number.isFinite(age) || !Number.isFinite(heightCm) || !Number.isFinite(weightKg)) {
    return NextResponse.json({ error: "age, heightCm and weightKg must be numbers" }, { status: 400 });
  }

  const profile: UserProfile = {
    id: "calculator",
    name: "Calculator User",
    email: undefined,
    age: age > 0 ? age : 26,
    sex: payload?.sex === "female" ? "female" : "male",
    heightCm: heightCm > 0 ? heightCm : 170,
    weightKg: weightKg > 0 ? weightKg : 70,
    activityLevel: (payload?.activityLevel as ActivityLevel) ?? "moderate",
    goal: (payload?.goal as GoalType) ?? "maintenance",
    dietPreference: (payload?.dietPreference as DietPreference) ?? "veg",
    targetWeightKg: payload?.targetWeightKg ? Number(payload.targetWeightKg) : undefined,
    weeklyWorkoutDays: weeklyWorkoutDays >= 0 ? weeklyWorkoutDays : 3,
    medicalNotes: undefined,
    googleFitConnected: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const requirements = calculateNutritionRequirements(profile);
  return NextResponse.json({ requirements });
}
