import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/profile-store";
import { buildProfileSummary } from "@/lib/profile-summary";
import { calculateNutritionRequirements } from "@/lib/nutrition-requirements";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

const DAILY_CHAT_LIMIT = 3;
const usageCollection = "aiCoachDailyUsage";

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

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const question = String(payload?.question ?? "").trim();

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const profile = await getProfileById(user.uid);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    await consumeDailyQuota(user.uid);
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_CHAT_LIMIT_REACHED") {
      return NextResponse.json(
        {
          error: "Daily chat limit reached. You can send up to 3 AI chats per day.",
          limit: DAILY_CHAT_LIMIT,
          dateKey: currentUtcDateKey(),
        },
        { status: 429 },
      );
    }

    throw error;
  }

  const summary = buildProfileSummary(profile);
  const reqs = calculateNutritionRequirements(profile);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = `Plan snapshot: ${summary.headline} Focus on ${Math.round(reqs.targetCalories)} kcal/day, protein ${Math.round(reqs.macros.protein_g)} g, carbs ${Math.round(reqs.macros.carbs_g)} g, fat ${Math.round(reqs.macros.fat_g)} g, and water ${Math.round(reqs.hydration.water_ml)} ml. Your question: ${question}.`;
    return NextResponse.json({ answer: fallback, mode: "fallback" });
  }

  const system =
    "You are a practical fitness and nutrition assistant. Be concise, safe, and specific. Avoid medical diagnosis and include practical, actionable advice.";
  const prompt = [
    `User profile summary: ${JSON.stringify(summary)}`,
    `Nutrition requirements: ${JSON.stringify(reqs)}`,
    `User question: ${question}`,
  ].join("\n");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      { error: "Gemini API call failed", detail: body.slice(0, 400) },
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

  return NextResponse.json({ answer, mode: "gemini", model });
}
