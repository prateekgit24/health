import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/profile-store";
import { buildProfileSummary } from "@/lib/profile-summary";
import { calculateNutritionRequirements } from "@/lib/nutrition-requirements";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

const DAILY_CHAT_LIMIT = 3;
const usageCollection = "aiCoachDailyUsage";

type CoachRequestPayload = {
  question?: unknown;
  input?: unknown;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function currentUtcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function compactText(value: unknown, maxLength = 220) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }

  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

function getUserInputContext(input: unknown) {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    const text = compactText(input, 500);
    return text ? { note: text } : null;
  }

  if (typeof input === "object") {
    const rawEntries = Object.entries(input as Record<string, unknown>);
    const filtered = rawEntries
      .map(([key, value]) => [key, compactText(value, 220)] as const)
      .filter(([, value]) => Boolean(value))
      .slice(0, 10);

    return filtered.length > 0 ? Object.fromEntries(filtered) : null;
  }

  return { note: compactText(input, 220) };
}

function buildProfilePromptContext(
  profile: Awaited<ReturnType<typeof getProfileById>>,
  summary: ReturnType<typeof buildProfileSummary>,
  reqs: ReturnType<typeof calculateNutritionRequirements>,
) {
  if (!profile) {
    return null;
  }

  return {
    basics: {
      age: profile.age,
      sex: profile.sex,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      weeklyWorkoutDays: profile.weeklyWorkoutDays,
      goal: profile.goal,
      dietPreference: profile.dietPreference,
      targetWeightKg: profile.targetWeightKg ?? null,
    },
    lifestyle: {
      sleepHours: profile.detailedProfile?.lifestyle?.sleepHours ?? null,
      stressLevel: profile.detailedProfile?.lifestyle?.stressLevel ?? null,
      trainingTime: profile.detailedProfile?.preferences?.trainingTime ?? null,
      constraints: profile.detailedProfile?.preferences?.constraints ?? null,
      goalDate: profile.detailedProfile?.preferences?.goalDate ?? null,
    },
    summary,
    nutritionTargets: {
      calories: Math.round(reqs.targetCalories),
      proteinG: Math.round(reqs.macros.protein_g),
      carbsG: Math.round(reqs.macros.carbs_g),
      fatG: Math.round(reqs.macros.fat_g),
      waterMl: Math.round(reqs.hydration.water_ml),
      fiberG: Math.round(reqs.micros.fiber_g),
    },
  };
}

function buildCoachSystemPrompt() {
  return [
    "You are HOW Coach, a practical fitness and nutrition assistant for everyday users.",
    "Primary objective: give safe, specific, and actionable guidance tailored to the user profile and user input.",
    "Do not diagnose diseases, prescribe drugs, or provide emergency/medical treatment plans.",
    "Use clear language, short lines, and avoid fluff.",
    "Respect profile context first (goal, activity level, diet preference, sleep/stress, constraints).",
    "If input and profile conflict, acknowledge conflict and suggest a realistic compromise.",
    "If user asks about food by transliterated Hindi names (aam, roti, dahi, anda, chawal), map them naturally to the known food names.",
    "Output format (strict):",
    "1) Key takeaway (1-2 lines)",
    "2) What to focus today (3 bullet points)",
    "3) Nutrition targets (calories/protein/carbs/fat/water in one compact bullet)",
    "4) 7-day action plan (3 bullet points)",
    "5) Safety note (only when relevant)",
  ].join("\n");
}

function buildCoachPrompt(
  question: string,
  profileContext: ReturnType<typeof buildProfilePromptContext>,
  inputContext: ReturnType<typeof getUserInputContext>,
) {
  return [
    "User Question:",
    question,
    "",
    "User Profile Context:",
    JSON.stringify(profileContext, null, 2),
    "",
    "Additional User Input Context:",
    JSON.stringify(inputContext, null, 2),
    "",
    "Now generate a response following the exact output format.",
  ].join("\n");
}

function buildFallbackCoachAnswer(
  profile: Awaited<ReturnType<typeof getProfileById>>,
  summary: ReturnType<typeof buildProfileSummary>,
  reqs: ReturnType<typeof calculateNutritionRequirements>,
  question: string,
) {
  const normalizedQuestion = question.toLowerCase();
  const asksExercise = /exercise|workout|training|gym|cardio|run|walk|steps/.test(normalizedQuestion);
  const asksNutrition = /diet|meal|nutrition|protein|carb|fat|calorie|food/.test(normalizedQuestion);

  const weeklyDays = Math.max(1, Number(profile?.weeklyWorkoutDays ?? 3));
  const activityLevel = profile?.activityLevel ?? "moderate";
  const goal = profile?.goal ?? "maintenance";

  const defaultDailyMinutesByActivityLevel: Record<string, number> = {
    sedentary: 30,
    light: 35,
    moderate: 45,
    active: 55,
    "very-active": 65,
  };

  const defaultStepsByActivityLevel: Record<string, number> = {
    sedentary: 7000,
    light: 8000,
    moderate: 9000,
    active: 10000,
    "very-active": 11000,
  };

  const goalBoostMinutes: Record<string, number> = {
    "fat-loss": 10,
    recomposition: 5,
    maintenance: 0,
    "muscle-gain": 5,
  };

  const targetDailyMinutes =
    (defaultDailyMinutesByActivityLevel[activityLevel] ?? 45) + (goalBoostMinutes[goal] ?? 0);
  const suggestedWorkoutDays = Math.min(6, Math.max(3, weeklyDays));
  const suggestedSteps = defaultStepsByActivityLevel[activityLevel] ?? 9000;

  const questionSpecificTakeaway = asksExercise
    ? `For your current profile, target ${suggestedWorkoutDays} workout days per week with about ${targetDailyMinutes} minutes of activity on training days.`
    : asksNutrition
      ? `For your current profile, prioritize nutrition consistency near ${Math.round(reqs.targetCalories)} kcal and protein around ${Math.round(reqs.macros.protein_g)} g daily.`
      : summary.headline;

  const focusBullets = asksExercise
    ? [
        `Complete ${suggestedWorkoutDays} sessions this week: 3 strength and ${Math.max(1, suggestedWorkoutDays - 3)} cardio or sport sessions.`,
        `Aim for ${targetDailyMinutes} active minutes and about ${suggestedSteps.toLocaleString()} steps today.`,
        "Keep one easier recovery day between intense sessions.",
      ]
    : [
        `Follow calorie target near ${Math.round(reqs.targetCalories)} kcal and hydration near ${Math.round(reqs.hydration.water_ml)} ml.`,
        `Keep protein around ${Math.round(reqs.macros.protein_g)} g across meals.`,
        "Prioritize consistency over perfection for this week.",
      ];

  const weekPlanBullets = asksExercise
    ? [
        "Plan your 7-day workout split in advance and lock session times in calendar.",
        "Progress one metric this week: either +1 set, +5 minutes, or +500 average daily steps.",
        "Review fatigue and sleep at week end; adjust intensity before increasing volume.",
      ]
    : [
        "Plan meals one day in advance.",
        "Complete 3 to 5 workouts and track completion.",
        "Review weekly trend and adjust one habit.",
      ];

  return [
    `Key takeaway: ${questionSpecificTakeaway}`,
    "What to focus today:",
    `- ${focusBullets[0]}`,
    `- ${focusBullets[1]}`,
    `- ${focusBullets[2]}`,
    "Nutrition targets:",
    `- ${Math.round(reqs.targetCalories)} kcal | Protein ${Math.round(reqs.macros.protein_g)} g | Carbs ${Math.round(reqs.macros.carbs_g)} g | Fat ${Math.round(reqs.macros.fat_g)} g | Water ${Math.round(reqs.hydration.water_ml)} ml`,
    "7-day action plan:",
    `- ${weekPlanBullets[0]}`,
    `- ${weekPlanBullets[1]}`,
    `- ${weekPlanBullets[2]}`,
    `Question received: ${question}`,
  ].join("\n");
}

async function consumeDailyQuota(uid: string) {
  const dateKey = currentUtcDateKey();
  const ref = getFirebaseAdminDb().collection(usageCollection).doc(`${uid}:${dateKey}`);
  const now = new Date().toISOString();
  let usedAfterWrite = 0;

  await getFirebaseAdminDb().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    const data = snapshot.data() as { count?: unknown; createdAt?: unknown } | undefined;
    const usedCount = Number(data?.count ?? 0);

    if (usedCount >= DAILY_CHAT_LIMIT) {
      throw new Error("DAILY_CHAT_LIMIT_REACHED");
    }

    usedAfterWrite = usedCount + 1;
    const createdAt = typeof data?.createdAt === "string" ? data.createdAt : now;

    tx.set(
      ref,
      {
        uid,
        dateKey,
        count: usedAfterWrite,
        createdAt,
        updatedAt: now,
      },
      { merge: true },
    );
  });

  return {
    used: usedAfterWrite,
    remaining: Math.max(0, DAILY_CHAT_LIMIT - usedAfterWrite),
    limit: DAILY_CHAT_LIMIT,
    dateKey,
  };
}

async function getDailyQuotaStatus(uid: string) {
  const dateKey = currentUtcDateKey();
  const ref = getFirebaseAdminDb().collection(usageCollection).doc(`${uid}:${dateKey}`);
  const snapshot = await ref.get();
  const data = snapshot.data() as { count?: unknown } | undefined;
  const used = Number(data?.count ?? 0);

  return {
    used,
    remaining: Math.max(0, DAILY_CHAT_LIMIT - used),
    limit: DAILY_CHAT_LIMIT,
    dateKey,
  };
}

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as CoachRequestPayload;
  const question = String(payload?.question ?? "").trim();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const profile = await getProfileById(user.uid);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const quotaStatus = await getDailyQuotaStatus(user.uid);
  if (quotaStatus.used >= DAILY_CHAT_LIMIT) {
    return NextResponse.json(
      {
        error: "Daily chat limit reached. You can send up to 3 AI chats per day.",
        code: "DAILY_CHAT_LIMIT_REACHED",
        ...quotaStatus,
      },
      { status: 429 },
    );
  }

  const summary = buildProfileSummary(profile);
  const reqs = calculateNutritionRequirements(profile);
  const profileContext = buildProfilePromptContext(profile, summary, reqs);
  const inputContext = getUserInputContext(payload?.input);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = buildFallbackCoachAnswer(profile, summary, reqs, question);
    return NextResponse.json({ answer: fallback, mode: "fallback" });
  }

  const system = buildCoachSystemPrompt();
  const prompt = buildCoachPrompt(question, profileContext, inputContext);

  const preferredModel = (process.env.GEMINI_MODEL ?? "gemini-2.5-flash").trim();
  const modelCandidates = Array.from(new Set([preferredModel, "gemini-2.5-flash", "gemini-flash-latest"]));

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 380,
    },
  });

  let model = preferredModel;
  let response: Response | null = null;
  for (const candidate of modelCandidates) {
    model = candidate;
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      },
    );

    if (response.ok) {
      break;
    }

    if (response.status !== 429) {
      break;
    }
  }

  if (!response) {
    return NextResponse.json({ error: "Gemini request was not executed", code: "GEMINI_REQUEST_SKIPPED" }, { status: 500 });
  }

  if (!response.ok) {
    const body = await response.text();

    if (response.status === 429) {
      const fallback = buildFallbackCoachAnswer(profile, summary, reqs, question);
      return NextResponse.json(
        {
          answer: fallback,
          mode: "fallback",
          warning: `Gemini quota reached for available models (${modelCandidates.join(", ")}). Using fallback coach response.`,
          code: "GEMINI_QUOTA_EXCEEDED",
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Gemini API call failed", code: "GEMINI_API_FAILED", detail: body.slice(0, 400) },
      { status: response.status },
    );
  }

  const data = (await response.json()) as GeminiGenerateResponse;
  const answer =
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n") || "No response generated.";

  try {
    await consumeDailyQuota(user.uid);
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_CHAT_LIMIT_REACHED") {
      return NextResponse.json(
        {
          answer,
          mode: "gemini",
          model,
          warning:
            "AI response generated, but daily usage update was not applied because the daily limit was reached in parallel requests.",
          code: "DAILY_CHAT_LIMIT_REACHED_POST_SUCCESS",
          ...quotaStatus,
        },
        { status: 200 },
      );
    }

    throw error;
  }

  return NextResponse.json({ answer, mode: "gemini", model });
}
