import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import type { InsightArticle } from "@/lib/insights-types";

const collectionName = "insightArticles";

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function sortByPublishedDesc(articles: InsightArticle[]) {
  return articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function listPublishedInsightArticles() {
  const snapshot = await getFirebaseAdminDb().collection(collectionName).get();

  return sortByPublishedDesc(
    snapshot.docs
      .map((doc) => doc.data() as InsightArticle)
      .filter((item) => item.isPublished),
  );
}

export async function listAllInsightArticles() {
  const snapshot = await getFirebaseAdminDb().collection(collectionName).get();

  return sortByPublishedDesc(snapshot.docs.map((doc) => doc.data() as InsightArticle));
}

export async function createInsightArticle(input: {
  title: string;
  summary: string;
  keyPoints: string[];
  url?: string;
  imageLinks?: string[];
  sourceName?: string;
  tags?: string[];
  isPublished: boolean;
  authorId?: string;
}) {
  const now = new Date().toISOString();
  const id = randomUUID();

  const article: InsightArticle = stripUndefined({
    id,
    title: input.title.trim(),
    summary: input.summary.trim(),
    keyPoints: input.keyPoints,
    url: input.url?.trim() || undefined,
    imageLinks: input.imageLinks && input.imageLinks.length > 0 ? input.imageLinks : undefined,
    sourceName: input.sourceName?.trim() || undefined,
    tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
    isPublished: input.isPublished,
    publishedAt: now,
    authorId: input.authorId,
    createdAt: now,
    updatedAt: now,
  }) as InsightArticle;

  await getFirebaseAdminDb().collection(collectionName).doc(id).set(article);
  return article;
}

export async function updateInsightArticle(
  articleId: string,
  patch: {
    title?: string;
    summary?: string;
    keyPoints?: string[];
    url?: string;
    imageLinks?: string[];
    sourceName?: string;
    tags?: string[];
    isPublished?: boolean;
  },
) {
  const ref = getFirebaseAdminDb().collection(collectionName).doc(articleId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Article not found.");
  }

  const current = existing.data() as InsightArticle;

  const next: InsightArticle = stripUndefined({
    ...current,
    title: patch.title !== undefined ? patch.title.trim() : current.title,
    summary: patch.summary !== undefined ? patch.summary.trim() : current.summary,
    keyPoints: patch.keyPoints ?? current.keyPoints,
    url: patch.url !== undefined ? patch.url.trim() || undefined : current.url,
    imageLinks:
      patch.imageLinks !== undefined
        ? patch.imageLinks.length > 0
          ? patch.imageLinks
          : undefined
        : current.imageLinks,
    sourceName: patch.sourceName !== undefined ? patch.sourceName.trim() || undefined : current.sourceName,
    tags: patch.tags !== undefined ? (patch.tags.length > 0 ? patch.tags : undefined) : current.tags,
    isPublished: patch.isPublished ?? current.isPublished,
    updatedAt: new Date().toISOString(),
  }) as InsightArticle;

  await ref.set(next);
  return next;
}

export async function deleteInsightArticle(articleId: string) {
  await getFirebaseAdminDb().collection(collectionName).doc(articleId).delete();
}
