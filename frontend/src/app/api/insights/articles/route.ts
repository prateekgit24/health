import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail, requireAdminUser } from "@/lib/admin-auth";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import {
  createInsightArticle,
  deleteInsightArticle,
  listAllInsightArticles,
  listPublishedInsightArticles,
  updateInsightArticle,
} from "@/lib/insights-store";
import type { InsightArticle } from "@/lib/insights-types";

const fallbackArticles: InsightArticle[] = [
  {
    id: "seed-sleep-recovery",
    title: "Sleep Is a Performance Multiplier",
    summary: "Better sleep quality improves recovery, training quality, appetite control, and stress response.",
    keyPoints: [
      "Aim for a stable sleep schedule and bedtime routine.",
      "Poor sleep can lower exercise output and increase cravings.",
      "7-9 hours is a practical baseline for most adults.",
    ],
    url: "https://www.cdc.gov/sleep/about_sleep/how_much_sleep.html",
    sourceName: "CDC",
    tags: ["recovery", "sleep", "performance"],
    isPublished: true,
    publishedAt: "2026-04-01T00:00:00.000Z",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "seed-protein-intake",
    title: "Protein Basics for Fitness Goals",
    summary: "Protein distribution and total daily intake both matter when preserving or building lean mass.",
    keyPoints: [
      "Spread protein across meals for better consistency.",
      "Training goals usually require higher protein than sedentary lifestyles.",
      "Whole food protein sources improve satiety and nutrient density.",
    ],
    url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6566799/",
    sourceName: "NIH",
    tags: ["nutrition", "protein", "muscle"],
    isPublished: true,
    publishedAt: "2026-03-20T00:00:00.000Z",
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-20T00:00:00.000Z",
  },
  {
    id: "seed-cardio-strength",
    title: "Combining Strength and Cardio Without Burnout",
    summary: "You can improve cardiovascular health and strength together when weekly loading is balanced.",
    keyPoints: [
      "Alternate hard and easy training days.",
      "Keep at least one recovery-oriented day each week.",
      "Track fatigue markers like sleep quality and soreness.",
    ],
    url: "https://www.heart.org/en/healthy-living/fitness/fitness-basics/aha-recs-for-physical-activity-infographic",
    sourceName: "American Heart Association",
    tags: ["training", "cardio", "strength"],
    isPublished: true,
    publishedAt: "2026-03-05T00:00:00.000Z",
    createdAt: "2026-03-05T00:00:00.000Z",
    updatedAt: "2026-03-05T00:00:00.000Z",
  },
];

function normalizeStringArray(input: unknown, delimiter: RegExp) {
  if (typeof input !== "string") {
    return [] as string[];
  }

  return input
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLinks(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return normalizeStringArray(input, /[\n,]+/g);
}

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  const admin = isAdminEmail(user?.email);

  try {
    const articles = admin ? await listAllInsightArticles() : await listPublishedInsightArticles();

    if (articles.length === 0) {
      return NextResponse.json({ articles: fallbackArticles, isAdmin: admin });
    }

    return NextResponse.json({ articles, isAdmin: admin });
  } catch (error) {
    console.error("GET /api/insights/articles failed; serving fallback articles", error);
    return NextResponse.json({ articles: fallbackArticles, isAdmin: admin });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdminUser(request);
  if (!adminCheck.user) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const payload = (await request.json()) as {
    title?: string;
    summary?: string;
    url?: string;
    imageLinks?: string | string[];
    sourceName?: string;
    keyPoints?: string | string[];
    tags?: string | string[];
    isPublished?: boolean;
  };

  const title = String(payload.title ?? "").trim();
  const summary = String(payload.summary ?? "").trim();

  if (!title || !summary) {
    return NextResponse.json({ error: "title and summary are required" }, { status: 400 });
  }

  const keyPoints = Array.isArray(payload.keyPoints)
    ? payload.keyPoints.map((item) => String(item).trim()).filter(Boolean)
    : normalizeStringArray(payload.keyPoints, /\n+/g);

  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((item) => String(item).trim()).filter(Boolean)
    : normalizeStringArray(payload.tags, /,+/g);

  const imageLinks = normalizeLinks(payload.imageLinks);

  try {
    const article = await createInsightArticle({
      title,
      summary,
      url: optionalText(payload.url),
      imageLinks,
      sourceName: optionalText(payload.sourceName),
      keyPoints,
      tags,
      isPublished: payload.isPublished !== false,
      authorId: adminCheck.user.uid,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create article";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdminUser(request);
  if (!adminCheck.user) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const payload = (await request.json()) as {
    id?: string;
    title?: string;
    summary?: string;
    url?: string;
    imageLinks?: string | string[];
    sourceName?: string;
    keyPoints?: string | string[];
    tags?: string | string[];
    isPublished?: boolean;
  };

  const id = String(payload.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const patch: {
    title?: string;
    summary?: string;
    url?: string;
    imageLinks?: string[];
    sourceName?: string;
    keyPoints?: string[];
    tags?: string[];
    isPublished?: boolean;
  } = {};

  if (typeof payload.title === "string") {
    patch.title = payload.title;
  }

  if (typeof payload.summary === "string") {
    patch.summary = payload.summary;
  }

  if (typeof payload.url === "string") {
    patch.url = payload.url;
  }

  if (payload.imageLinks !== undefined) {
    patch.imageLinks = normalizeLinks(payload.imageLinks);
  }

  if (typeof payload.sourceName === "string") {
    patch.sourceName = payload.sourceName;
  }

  if (payload.keyPoints !== undefined) {
    patch.keyPoints = Array.isArray(payload.keyPoints)
      ? payload.keyPoints.map((item) => String(item).trim()).filter(Boolean)
      : normalizeStringArray(payload.keyPoints, /\n+/g);
  }

  if (payload.tags !== undefined) {
    patch.tags = Array.isArray(payload.tags)
      ? payload.tags.map((item) => String(item).trim()).filter(Boolean)
      : normalizeStringArray(payload.tags, /,+/g);
  }

  if (typeof payload.isPublished === "boolean") {
    patch.isPublished = payload.isPublished;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  try {
    const article = await updateInsightArticle(id, patch);
    return NextResponse.json({ article });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update article";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdminUser(request);
  if (!adminCheck.user) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const payload = (await request.json()) as { id?: string };
  const id = String(payload.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await deleteInsightArticle(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete article";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
