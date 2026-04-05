import { NextRequest, NextResponse } from "next/server";
import { getProfileById, upsertProfile } from "@/lib/profile-store";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import type { DetailedProfile, StressLevel } from "@/lib/profile-types";

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalPositiveNumber(value: unknown, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) {
    return undefined;
  }

  return Math.round(parsed * 10) / 10;
}

function optionalStressLevel(value: unknown) {
  const allowed: StressLevel[] = ["low", "moderate", "high"];
  return allowed.includes(value as StressLevel) ? (value as StressLevel) : undefined;
}

function buildDetailedProfile(payload: unknown): DetailedProfile | undefined {
  const source = payload as {
    lifestyle?: { sleepHours?: unknown; stressLevel?: unknown; jobActivity?: unknown };
    medical?: {
      bloodGroup?: unknown;
      hemoglobinGdl?: unknown;
      eyesightLeft?: unknown;
      eyesightRight?: unknown;
      fastingSugarMgDl?: unknown;
      postMealSugarMgDl?: unknown;
      bloodPressureSystolic?: unknown;
      bloodPressureDiastolic?: unknown;
      restingHeartRateBpm?: unknown;
      allergies?: unknown;
      conditions?: unknown;
      injuries?: unknown;
      medications?: unknown;
      notes?: unknown;
    };
    preferences?: { trainingTime?: unknown; constraints?: unknown; goalDate?: unknown };
  };

  const lifestyle = {
    sleepHours: optionalPositiveNumber(source?.lifestyle?.sleepHours, 24),
    stressLevel: optionalStressLevel(source?.lifestyle?.stressLevel),
    jobActivity: optionalText(source?.lifestyle?.jobActivity),
  };

  const medical = {
    bloodGroup: optionalText(source?.medical?.bloodGroup),
    hemoglobinGdl: optionalPositiveNumber(source?.medical?.hemoglobinGdl, 40),
    eyesightLeft: optionalText(source?.medical?.eyesightLeft),
    eyesightRight: optionalText(source?.medical?.eyesightRight),
    fastingSugarMgDl: optionalPositiveNumber(source?.medical?.fastingSugarMgDl, 600),
    postMealSugarMgDl: optionalPositiveNumber(source?.medical?.postMealSugarMgDl, 700),
    bloodPressureSystolic: optionalPositiveNumber(source?.medical?.bloodPressureSystolic, 300),
    bloodPressureDiastolic: optionalPositiveNumber(source?.medical?.bloodPressureDiastolic, 250),
    restingHeartRateBpm: optionalPositiveNumber(source?.medical?.restingHeartRateBpm, 260),
    allergies: optionalText(source?.medical?.allergies),
    conditions: optionalText(source?.medical?.conditions),
    injuries: optionalText(source?.medical?.injuries),
    medications: optionalText(source?.medical?.medications),
    notes: optionalText(source?.medical?.notes),
  };

  const preferences = {
    trainingTime: optionalText(source?.preferences?.trainingTime),
    constraints: optionalText(source?.preferences?.constraints),
    goalDate: optionalText(source?.preferences?.goalDate),
  };

  const hasLifestyle = Object.values(lifestyle).some((value) => value !== undefined);
  const hasMedical = Object.values(medical).some((value) => value !== undefined);
  const hasPreferences = Object.values(preferences).some((value) => value !== undefined);

  if (!hasLifestyle && !hasMedical && !hasPreferences) {
    return undefined;
  }

  return {
    lifestyle: hasLifestyle ? lifestyle : undefined,
    medical: hasMedical ? medical : undefined,
    preferences: hasPreferences ? preferences : undefined,
  };
}

function toApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";

  if (message.includes("Missing Firebase Admin env vars")) {
    return {
      status: 500,
      error:
        "Server Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in runtime env and restart the server.",
    };
  }

  if (message.toLowerCase().includes("permission")) {
    return {
      status: 500,
      error: "Firestore permission/config error. Verify Firestore is created and Admin credentials belong to this project.",
    };
  }

  return {
    status: 500,
    error: message,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfileById(user.uid);
    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    const apiError = toApiError(error);
    console.error("GET /api/profile failed", error);
    return NextResponse.json({ error: apiError.error }, { status: apiError.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireFirebaseUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const existingProfile = await getProfileById(user.uid);

    if (!existingProfile && payload?.termsAccepted !== true) {
      return NextResponse.json(
        { error: "You must accept Terms and Conditions before creating a profile." },
        { status: 400 },
      );
    }

    const age = Number(payload?.age ?? 26);
    const heightCm = Number(payload?.heightCm ?? 170);
    const weightKg = Number(payload?.weightKg ?? 70);
    const weeklyWorkoutDays = Number(payload?.weeklyWorkoutDays ?? 3);
    const detailedProfile = buildDetailedProfile(payload?.detailedProfile);
    const medicalNotes = optionalText(payload?.medicalNotes) ?? detailedProfile?.medical?.notes;
    const avatarEmoji = optionalText(payload?.avatarEmoji);
    const compareOptIn = Boolean(payload?.compareOptIn);
    const termsAcceptedAt = existingProfile?.termsAcceptedAt ?? (payload?.termsAccepted ? new Date().toISOString() : undefined);

    const profile = await upsertProfile({
      id: user.uid,
      name: payload?.name ? String(payload.name) : user.name || "User",
      email: payload?.email ? String(payload.email) : user.email,
      avatarEmoji,
      age: Number.isFinite(age) && age > 0 ? age : 26,
      sex: payload.sex === "female" ? "female" : "male",
      heightCm: Number.isFinite(heightCm) && heightCm > 0 ? heightCm : 170,
      weightKg: Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 70,
      activityLevel: payload.activityLevel ?? "moderate",
      goal: payload.goal ?? "maintenance",
      dietPreference: payload.dietPreference ?? "veg",
      targetWeightKg: payload?.targetWeightKg ? Number(payload.targetWeightKg) : undefined,
      weeklyWorkoutDays: Number.isFinite(weeklyWorkoutDays) && weeklyWorkoutDays >= 0 ? weeklyWorkoutDays : 3,
      medicalNotes,
      detailedProfile,
      compareOptIn,
      termsAcceptedAt,
      googleFitConnected: Boolean(payload.googleFitConnected),
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const apiError = toApiError(error);
    console.error("POST /api/profile failed", error);
    return NextResponse.json({ error: apiError.error }, { status: apiError.status });
  }
}
