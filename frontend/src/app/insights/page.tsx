"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import type { InsightArticle } from "@/lib/insights-types";

type InsightsResponse = {
  articles?: InsightArticle[];
  isAdmin?: boolean;
  error?: string;
};

type ArticleForm = {
  title: string;
  summary: string;
  keyPoints: string;
  url: string;
  imageLinks: string;
  sourceName: string;
  tags: string;
  isPublished: boolean;
};

const defaultForm: ArticleForm = {
  title: "",
  summary: "",
  keyPoints: "",
  url: "",
  imageLinks: "",
  sourceName: "",
  tags: "",
  isPublished: true,
};

function formatDate(iso: string) {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return "Unknown date";
  }

  return new Date(parsed).toLocaleDateString();
}

function cleanPreviewKeyPoints(points: string[]) {
  return points.filter((point) => point.trim()).slice(0, 4);
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<InsightArticle[]>([]);
  const [form, setForm] = useState<ArticleForm>(defaultForm);

  const loadArticles = useCallback(async (user: User | null) => {
    setLoading(true);

    try {
      const headers = new Headers();
      if (user) {
        const token = await user.getIdToken();
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch("/api/insights/articles", { headers });
      const payload = (await response.json()) as InsightsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load insights");
      }

      setArticles(payload.articles ?? []);
      setIsAdmin(Boolean(payload.isAdmin));
      setMessage(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load insights";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      await loadArticles(user);
    });

    return () => unsubscribe();
  }, [loadArticles]);

  const publishedArticles = useMemo(
    () => articles.filter((article) => article.isPublished),
    [articles],
  );

  async function submitArticle(event: FormEvent) {
    event.preventDefault();
    if (!authUser) {
      setMessage("Please log in with an admin account to create articles.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/insights/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { article?: InsightArticle; error?: string };
      if (!response.ok || !payload.article) {
        throw new Error(payload.error ?? "Failed to create article");
      }

      setForm(defaultForm);
      setMessage("Article published successfully.");
      await loadArticles(authUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to publish article";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(article: InsightArticle) {
    if (!authUser) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/insights/articles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: article.id, isPublished: !article.isPublished }),
      });

      const payload = (await response.json()) as { article?: InsightArticle; error?: string };
      if (!response.ok || !payload.article) {
        throw new Error(payload.error ?? "Failed to update article");
      }

      await loadArticles(authUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update article";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function removeArticle(id: string) {
    if (!authUser) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await authUser.getIdToken();
      const response = await fetch("/api/insights/articles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete article");
      }

      setMessage("Article removed.");
      await loadArticles(authUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete article";
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-primary-200/20 bg-primary-950/25 p-6 sm:p-8">
        <h1 className="text-4xl font-semibold tracking-tight text-primary-50">Fitness Insights</h1>
        <p className="mt-3 max-w-3xl text-primary-100/80">
          Read practical fitness and nutrition articles curated like a health newspaper feed.
          Each post includes key points and a direct link to read the full source in a new tab.
        </p>
      </section>

      {message ? (
        <p className="mt-4 rounded-xl border border-primary-200/30 bg-primary-500/10 p-3 text-sm text-primary-100">
          {message}
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {(loading ? [] : publishedArticles).map((article) => (
          <article key={article.id} className="rounded-2xl border border-primary-200/20 bg-primary-950/25 p-5">
            {article.imageLinks?.[0] ? (
              <div
                className="mb-4 h-44 w-full rounded-xl border border-primary-200/15 bg-cover bg-center"
                style={{ backgroundImage: `url(${article.imageLinks[0]})` }}
                aria-label={`Cover image for ${article.title}`}
              />
            ) : null}

            <p className="text-xs uppercase tracking-[0.18em] text-primary-200/70">{formatDate(article.publishedAt)}</p>
            <h2 className="mt-2 text-2xl font-semibold text-secondary-200">{article.title}</h2>
            <p className="mt-2 text-sm text-primary-100/85">{article.summary}</p>

            {cleanPreviewKeyPoints(article.keyPoints).length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-primary-100/90">
                {cleanPreviewKeyPoints(article.keyPoints).map((point) => (
                  <li key={`${article.id}-${point}`} className="rounded-lg border border-primary-200/15 bg-primary-950/35 px-3 py-2">
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(article.tags ?? []).map((tag) => (
                <span key={`${article.id}-${tag}`} className="rounded-full border border-primary-200/25 px-2 py-0.5 text-xs text-primary-100/85">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-primary-100/70">Source: {article.sourceName ?? "Editorial"}</p>
              {article.url ? (
                <Link
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-secondary-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-secondary-200"
                >
                  Read Full Article
                </Link>
              ) : (
                <span className="rounded-full border border-primary-200/25 px-3 py-1 text-xs font-semibold text-primary-100/85">
                  General Post
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      {!loading && publishedArticles.length === 0 ? (
        <p className="mt-6 rounded-xl border border-primary-200/20 bg-primary-950/25 p-4 text-sm text-primary-100/80">
          No published articles yet. Check back soon for new insights.
        </p>
      ) : null}

      {isAdmin ? (
        <section className="mt-10 rounded-2xl border border-secondary-300/30 bg-secondary-200/10 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-secondary-100">Admin Article Manager</h2>
          <p className="mt-2 text-sm text-secondary-100/85">
            Only admin accounts can create, publish/unpublish, or delete insight posts.
          </p>

          <form onSubmit={submitArticle} className="mt-4 grid gap-3">
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Article title"
              className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
            />
            <textarea
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              rows={3}
              placeholder="Short summary"
              className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
            />
            <textarea
              value={form.keyPoints}
              onChange={(event) => setForm((prev) => ({ ...prev, keyPoints: event.target.value }))}
              rows={4}
              placeholder="Key points (one per line)"
              className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
            />
            <input
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              placeholder="External article URL (optional)"
              className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
            />
            <textarea
              value={form.imageLinks}
              onChange={(event) => setForm((prev) => ({ ...prev, imageLinks: event.target.value }))}
              rows={3}
              placeholder="Image links (optional, one per line or comma separated)"
              className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.sourceName}
                onChange={(event) => setForm((prev) => ({ ...prev, sourceName: event.target.value }))}
                placeholder="Source name"
                className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
              />
              <input
                value={form.tags}
                onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="Tags (comma separated)"
                className="rounded-lg border border-secondary-200/35 bg-black/20 px-3 py-2 text-sm text-secondary-50"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-secondary-100/90">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
              />
              Publish immediately
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-fit rounded-full bg-secondary-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-secondary-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Article
            </button>
          </form>

          <div className="mt-6 space-y-2">
            {articles.map((article) => (
              <div key={article.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-200/30 bg-black/15 px-3 py-2 text-sm text-secondary-50">
                <div>
                  <p className="font-semibold">{article.title}</p>
                  <p className="text-xs opacity-85">{article.isPublished ? "Published" : "Draft"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => togglePublish(article)}
                    disabled={saving}
                    className="rounded-full border border-secondary-200/40 px-3 py-1 text-xs font-semibold hover:border-secondary-100"
                  >
                    {article.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeArticle(article.id)}
                    disabled={saving}
                    className="rounded-full border border-alert-300/50 px-3 py-1 text-xs font-semibold text-alert-100 hover:border-alert-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
