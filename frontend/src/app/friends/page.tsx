"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

type HubTab = "feed" | "leaderboard" | "challenges";
type CompareWindow = "today" | "week";

type FriendIdentity = {
  uid: string;
  name: string;
  email?: string;
  avatarEmoji?: string;
  compareOptIn: boolean;
};

type FriendsApiData = {
  incoming: Array<{ requestId: string; createdAt: string; from: FriendIdentity }>;
  outgoing: Array<{ requestId: string; createdAt: string; to: FriendIdentity }>;
  friends: Array<{ requestId: string; connectedAt: string; friend: FriendIdentity }>;
};

type CompareApiData = {
  ownSummary: {
    steps: number;
    caloriesKcal: number;
    distanceMeters?: number;
    activeMinutes?: number;
    heartMinutes?: number;
    dailySteps?: number;
    dailyCaloriesKcal?: number;
    dailyDistanceMeters?: number;
    dailyActiveMinutes?: number;
    dailyHeartPoints?: number;
  } | null;
  entries: Array<{
    uid: string;
    name: string;
    email?: string;
    avatarEmoji?: string;
    connectedAt?: string;
    health: {
      syncedAt: string;
      steps: number;
      caloriesKcal: number;
      distanceMeters?: number;
      activeMinutes?: number;
      heartMinutes?: number;
      dailySteps?: number;
      dailyCaloriesKcal?: number;
      dailyDistanceMeters?: number;
      dailyActiveMinutes?: number;
      dailyHeartPoints?: number;
    } | null;
  }>;
  blockedCount?: number;
  blockedReason?: string;
  globalPercentile?: {
    stepsPercentile: number | null;
    participantCount: number;
  } | null;
};

type CommunityPost = {
  id: string;
  authorUid: string;
  content: string;
  mediaUrl?: string;
  tags: string[];
  mentions: string[];
  milestone: boolean;
  kudosCount: number;
  commentCount: number;
  likedByViewer: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    uid: string;
    name: string;
    email?: string;
    avatarEmoji?: string;
  };
};

type CommunityComment = {
  id: string;
  postId: string;
  authorUid: string;
  content: string;
  createdAt: string;
  author: {
    uid: string;
    name: string;
    avatarEmoji?: string;
  };
};

type CommunityChallenge = {
  id: string;
  title: string;
  description?: string;
  metricType: "steps" | "activeMinutes" | "waterMl";
  targetValue: number;
  startDate: string;
  endDate: string;
  createdByUid: string;
  participantUids: string[];
  inviteUids: string[];
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
  createdBy: {
    uid: string;
    name: string;
    avatarEmoji?: string;
  };
  participants: Array<{
    uid: string;
    name: string;
    avatarEmoji?: string;
  }>;
  invitees: Array<{
    uid: string;
    name: string;
    avatarEmoji?: string;
  }>;
};

type ChallengeFormState = {
  title: string;
  description: string;
  metricType: "steps" | "activeMinutes" | "waterMl";
  targetValue: string;
  startDate: string;
  endDate: string;
  inviteUids: string[];
};

function safeNumber(value: number | undefined) {
  return Number.isFinite(value ?? NaN) ? Number(value) : 0;
}

function formatMetric(value: number | undefined, unit = "") {
  const formatted = Math.round(safeNumber(value)).toLocaleString();
  return unit ? `${formatted} ${unit}` : formatted;
}

function toFriendlyError(error: unknown, fallback: string) {
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  const firebaseNetwork = error instanceof FirebaseError && error.code === "auth/network-request-failed";
  const networkMessage =
    error instanceof Error &&
    /network-request-failed|internet_disconnected|failed to fetch|network/i.test(error.message);

  if (offline || firebaseNetwork || networkMessage) {
    return "You appear to be offline. Reconnect to the internet and try again.";
  }

  return error instanceof Error ? error.message : fallback;
}

function pickMetrics(
  health:
    | {
        steps?: number;
        caloriesKcal?: number;
        distanceMeters?: number;
        activeMinutes?: number;
        heartMinutes?: number;
        dailySteps?: number;
        dailyCaloriesKcal?: number;
        dailyDistanceMeters?: number;
        dailyActiveMinutes?: number;
        dailyHeartPoints?: number;
      }
    | null
    | undefined,
  window: CompareWindow,
) {
  if (window === "today") {
    return {
      steps: safeNumber(health?.dailySteps),
      caloriesKcal: safeNumber(health?.dailyCaloriesKcal),
      distanceMeters: safeNumber(health?.dailyDistanceMeters),
      activeMinutes: safeNumber(health?.dailyActiveMinutes),
      heartPoints: safeNumber(health?.dailyHeartPoints),
    };
  }

  return {
    steps: safeNumber(health?.steps),
    caloriesKcal: safeNumber(health?.caloriesKcal),
    distanceMeters: safeNumber(health?.distanceMeters),
    activeMinutes: safeNumber(health?.activeMinutes),
    heartPoints: safeNumber(health?.heartMinutes),
  };
}

function parseYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isYoutuBe = host === "youtu.be" || host === "www.youtu.be";
    const isYoutube = host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com";

    if (isYoutuBe) {
      const id = parsed.pathname.replace("/", "").trim();
      if (id) {
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
    }

    if (isYoutube) {
      const id = parsed.searchParams.get("v") ?? "";
      if (id) {
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const shortId = parsed.pathname.replace("/shorts/", "").trim();
        if (shortId) {
          return `https://www.youtube-nocookie.com/embed/${shortId}`;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeSafeHttpUrl(input: string) {
  try {
    const parsed = new URL(input);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function detectFirstUrl(content: string) {
  const match = content.match(/https?:\/\/\S+/i);
  return match ? match[0].replace(/[),.;!?]+$/, "") : "";
}

function parseTagsInput(input: string) {
  return input
    .split(/[,\s]+/)
    .map((tag) => tag.trim().replace(/^#+/, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 6);
}

function formatDate(iso: string) {
  if (!iso) {
    return "";
  }
  return new Date(iso).toLocaleString();
}

function MediaPreview({ sourceUrl }: { sourceUrl: string }) {
  const safeUrl = normalizeSafeHttpUrl(sourceUrl);
  if (!safeUrl) {
    return null;
  }

  const youtubeEmbed = parseYoutubeEmbed(safeUrl);
  const imageLike = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(safeUrl);

  if (youtubeEmbed) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-primary-200/40 dark:border-primary-300/20 bg-black">
        <iframe
          src={youtubeEmbed}
          title="YouTube preview"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-56 w-full sm:h-72"
        />
      </div>
    );
  }

  if (imageLike) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-primary-200/40 dark:border-primary-300/20 bg-slate-100 dark:bg-primary-950/50">
        <img
          src={safeUrl}
          alt="Post media"
          loading="lazy"
          className="max-h-105 w-full object-cover"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center rounded-lg border border-primary-300/40 bg-primary-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-primary-100 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100 dark:hover:bg-primary-900/40"
    >
      Open external media link
    </a>
  );
}

export default function FriendsPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [currentUid, setCurrentUid] = useState("");
  const [tab, setTab] = useState<HubTab>("leaderboard");
  const [message, setMessage] = useState<string | null>(null);

  const [friendEmail, setFriendEmail] = useState("");
  const [compareWindow, setCompareWindow] = useState<CompareWindow>("week");
  const [friendsData, setFriendsData] = useState<FriendsApiData>({ incoming: [], outgoing: [], friends: [] });
  const [compareData, setCompareData] = useState<CompareApiData>({ ownSummary: null, entries: [] });

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [postText, setPostText] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postTagsInput, setPostTagsInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeForm, setChallengeForm] = useState<ChallengeFormState>({
    title: "",
    description: "",
    metricType: "steps",
    targetValue: "10000",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    inviteUids: [],
  });

  const authedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const firebaseAuth = getFirebaseAuth();
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return fetch(input, init);
    }

    let token: string;
    try {
      token = await currentUser.getIdToken();
    } catch (error) {
      throw new Error(toFriendlyError(error, "Unable to authenticate request."));
    }

    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);

    try {
      return await fetch(input, {
        ...init,
        headers,
      });
    } catch (error) {
      throw new Error(toFriendlyError(error, "Network request failed."));
    }
  }, []);

  const loadFriendsAndCompare = useCallback(async () => {
    const [friendsRes, compareRes] = await Promise.all([
      authedFetch("/api/friends"),
      authedFetch("/api/friends/compare"),
    ]);

    const friendsJson = (await friendsRes.json()) as FriendsApiData & { error?: string };
    const compareJson = (await compareRes.json()) as CompareApiData & { error?: string };

    if (!friendsRes.ok) {
      throw new Error(friendsJson.error ?? "Failed to load friends data");
    }

    if (!compareRes.ok) {
      throw new Error(compareJson.error ?? "Failed to load comparison data");
    }

    setFriendsData(friendsJson);
    setCompareData(compareJson);
  }, [authedFetch]);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const response = await authedFetch("/api/community/feed");
      const payload = (await response.json()) as { posts?: CommunityPost[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load community feed");
      }
      setPosts(payload.posts ?? []);
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to load community feed."));
    } finally {
      setFeedLoading(false);
    }
  }, [authedFetch]);

  const loadChallenges = useCallback(async () => {
    setChallengeLoading(true);
    try {
      const response = await authedFetch("/api/community/challenges");
      const payload = (await response.json()) as { challenges?: CommunityChallenge[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load challenges");
      }
      setChallenges(payload.challenges ?? []);
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to load challenges."));
    } finally {
      setChallengeLoading(false);
    }
  }, [authedFetch]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      await Promise.all([loadFriendsAndCompare(), loadFeed(), loadChallenges()]);
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to load community data."));
    } finally {
      setLoading(false);
    }
  }, [loadFriendsAndCompare, loadFeed, loadChallenges]);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setAuthed(false);
        setCurrentUid("");
        setLoading(false);
        return;
      }

      setAuthed(true);
      setCurrentUid(user.uid);
      await loadAll();
    });

    return () => unsub();
  }, [loadAll]);

  const ownTotals = useMemo(() => pickMetrics(compareData.ownSummary, compareWindow), [compareData.ownSummary, compareWindow]);

  const leaderboard = useMemo(() => {
    const rows = [
      {
        name: "You",
        avatarEmoji: "💚",
        isYou: true,
        steps: ownTotals.steps,
        caloriesKcal: ownTotals.caloriesKcal,
        distanceMeters: ownTotals.distanceMeters,
        activeMinutes: ownTotals.activeMinutes,
        heartPoints: ownTotals.heartPoints,
      },
      ...compareData.entries.map((entry) => ({
        name: entry.name,
        avatarEmoji: entry.avatarEmoji ?? "💚",
        isYou: false,
        ...pickMetrics(entry.health, compareWindow),
      })),
    ];

    return rows.sort((a, b) => b.steps - a.steps);
  }, [compareData.entries, ownTotals, compareWindow]);

  const maxStepValue = useMemo(() => leaderboard.reduce((max, row) => Math.max(max, row.steps), 0), [leaderboard]);

  const averageFriend = useMemo(() => {
    if (compareData.entries.length === 0) {
      return { steps: 0, caloriesKcal: 0, distanceMeters: 0, activeMinutes: 0, heartPoints: 0 };
    }

    const sums = compareData.entries.reduce(
      (acc, entry) => {
        const metrics = pickMetrics(entry.health, compareWindow);
        acc.steps += metrics.steps;
        acc.caloriesKcal += metrics.caloriesKcal;
        acc.distanceMeters += metrics.distanceMeters;
        acc.activeMinutes += metrics.activeMinutes;
        acc.heartPoints += metrics.heartPoints;
        return acc;
      },
      { steps: 0, caloriesKcal: 0, distanceMeters: 0, activeMinutes: 0, heartPoints: 0 },
    );

    return {
      steps: sums.steps / compareData.entries.length,
      caloriesKcal: sums.caloriesKcal / compareData.entries.length,
      distanceMeters: sums.distanceMeters / compareData.entries.length,
      activeMinutes: sums.activeMinutes / compareData.entries.length,
      heartPoints: sums.heartPoints / compareData.entries.length,
    };
  }, [compareData.entries, compareWindow]);

  const milestoneDraft = useMemo(() => {
    const weeklySteps = safeNumber(compareData.ownSummary?.steps);
    if (weeklySteps >= 100000) {
      return "Milestone unlocked: crossed 100k steps this week. Consistency > intensity. #running #discipline";
    }
    if (weeklySteps >= 50000) {
      return "Massive win: crossed 50k weekly steps. Progress is stacking. #fitness #steps";
    }
    if (weeklySteps >= 20000) {
      return "Momentum update: passed 20k steps this week. Small actions keep compounding. #consistency";
    }
    return "";
  }, [compareData.ownSummary?.steps]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTag === "all") {
      return posts;
    }
    return posts.filter((post) => post.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  const activeChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === "active"),
    [challenges],
  );

  const completedChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === "completed"),
    [challenges],
  );

  async function sendRequest(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await authedFetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email: friendEmail }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send friend request");
      }

      setFriendEmail("");
      setMessage("Friend request sent.");
      await loadFriendsAndCompare();
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to send request."));
    }
  }

  async function respondRequest(requestId: string, action: "accept" | "decline") {
    setMessage(null);
    try {
      const response = await authedFetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update request");
      }

      setMessage(action === "accept" ? "Friend request accepted." : "Friend request declined.");
      await loadFriendsAndCompare();
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to update friend request."));
    }
  }

  async function createPost(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await authedFetch("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postText,
          mediaUrl: postMediaUrl,
          tags: parseTagsInput(postTagsInput),
          milestone: postText === milestoneDraft && milestoneDraft.length > 0,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create post");
      }

      setPostText("");
      setPostMediaUrl("");
      setPostTagsInput("");
      await loadFeed();
      setMessage("Your community post is live.");
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to publish post."));
    }
  }

  async function toggleKudos(postId: string) {
    try {
      const response = await authedFetch(`/api/community/feed/${postId}/kudos`, { method: "POST" });
      const payload = (await response.json()) as {
        likedByViewer?: boolean;
        kudosCount?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update kudos");
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByViewer: Boolean(payload.likedByViewer),
                kudosCount: Number(payload.kudosCount ?? post.kudosCount),
              }
            : post,
        ),
      );
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to update kudos."));
    }
  }

  async function toggleComments(postId: string) {
    const nextExpanded = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextExpanded }));

    if (!nextExpanded || commentsByPost[postId]) {
      return;
    }

    try {
      setCommentLoading((prev) => ({ ...prev, [postId]: true }));
      const response = await authedFetch(`/api/community/feed/${postId}/comments`);
      const payload = (await response.json()) as { comments?: CommunityComment[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load comments");
      }
      setCommentsByPost((prev) => ({ ...prev, [postId]: payload.comments ?? [] }));
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to load comments."));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function addComment(postId: string) {
    const draft = (commentDrafts[postId] ?? "").trim();
    if (!draft) {
      return;
    }

    try {
      const response = await authedFetch(`/api/community/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const payload = (await response.json()) as { comment?: CommunityComment; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to add comment");
      }

      const created = payload.comment;
      if (created) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] ?? []), created],
        }));
      }
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentCount: post.commentCount + 1,
              }
            : post,
        ),
      );
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to add comment."));
    }
  }

  async function createChallenge(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await authedFetch("/api/community/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: challengeForm.title,
          description: challengeForm.description,
          metricType: challengeForm.metricType,
          targetValue: Number(challengeForm.targetValue),
          startDate: challengeForm.startDate,
          endDate: challengeForm.endDate,
          inviteUids: challengeForm.inviteUids,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create challenge");
      }

      setChallengeForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        targetValue: "10000",
        inviteUids: [],
      }));
      setMessage("Challenge created and invites sent.");
      await loadChallenges();
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to create challenge."));
    }
  }

  async function joinChallenge(challengeId: string) {
    try {
      const response = await authedFetch(`/api/community/challenges/${challengeId}/join`, { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to join challenge");
      }

      setMessage("You joined the challenge.");
      await loadChallenges();
    } catch (error) {
      setMessage(toFriendlyError(error, "Failed to join challenge."));
    }
  }

  if (!authed && !loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-primary-200/30 bg-white p-6 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Community and Friends Hub</h1>
          <p className="mt-2 text-sm text-slate-700 dark:text-primary-100/80">
            Login from your profile to unlock the community feed, friend leaderboard, and micro-challenges.
          </p>
          <Link
            href="/profile"
            className="mt-5 inline-flex rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Go to Profile
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-primary-200/40 bg-linear-to-br from-white to-primary-50 p-6 text-slate-900 shadow-sm dark:border-primary-300/20 dark:from-primary-950/45 dark:to-primary-900/25 dark:text-primary-100 sm:p-8">
        <p className="inline-flex rounded-full bg-primary-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-800 dark:bg-primary-900/50 dark:text-primary-200">
          Unified Community Hub
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Friends, Community, and Active Challenges
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-800 dark:text-primary-100/85 sm:text-base">
          Share feats, celebrate milestones, challenge your friends, and compare progress with privacy-aware controls.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "leaderboard", label: "Friends" },
            { id: "feed", label: "Community" },
            { id: "challenges", label: "Active Challenges" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as HubTab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                tab === item.id
                  ? "bg-primary-600 text-white shadow"
                  : "border border-primary-300/50 bg-white text-slate-700 hover:bg-primary-50 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100 dark:hover:bg-primary-900/40"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {message ? (
        <p className="mt-4 rounded-xl border border-primary-300/40 bg-primary-50 px-4 py-3 text-sm text-slate-900 dark:border-primary-300/30 dark:bg-primary-900/25 dark:text-primary-100">
          {message}
        </p>
      ) : null}

      {compareData.blockedReason ? (
        <p className="mt-4 rounded-xl border border-secondary-300/40 bg-secondary-50 px-4 py-3 text-sm text-secondary-800 dark:border-secondary-300/40 dark:bg-secondary-300/10 dark:text-secondary-100">
          {compareData.blockedReason}
        </p>
      ) : null}

      {tab === "feed" ? (
        <section className="mt-6 space-y-6">
          <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Share your workout feat</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-primary-100/80">
              Paste a YouTube or image URL for lightweight media sharing, add tags, and mention friends with @name.
            </p>

            <form onSubmit={createPost} className="mt-4 space-y-3">
              <textarea
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
                placeholder="Example: Just hit my first 5-minute plank. #core @sam"
                className="min-h-32.5 w-full rounded-xl border border-primary-200/50 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-primary-400 focus:outline-none dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={postMediaUrl}
                  onChange={(event) => setPostMediaUrl(event.target.value)}
                  placeholder="https://youtube.com/... or https://site.com/image.jpg"
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
                />
                <input
                  value={postTagsInput}
                  onChange={(event) => setPostTagsInput(event.target.value)}
                  placeholder="#running, #nutrition"
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Publish Post
                </button>
                {milestoneDraft ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPostText(milestoneDraft);
                      setPostTagsInput("milestone");
                    }}
                    className="rounded-full border border-success-400/50 bg-success-50 px-4 py-2 text-xs font-semibold text-success-800 hover:bg-success-100 dark:border-success-300/40 dark:bg-success-500/15 dark:text-success-100 dark:hover:bg-success-500/25"
                  >
                    Use Auto Milestone Draft
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="rounded-2xl border border-primary-200/40 bg-white p-4 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedTag === "all"
                    ? "bg-primary-600 text-white"
                    : "border border-primary-300/50 bg-white text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
                }`}
              >
                All posts
              </button>
              {tagCounts.map(([tag, count]) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedTag === tag
                      ? "bg-primary-600 text-white"
                      : "border border-primary-300/50 bg-white text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
                  }`}
                >
                  #{tag} ({count})
                </button>
              ))}
            </div>
          </article>

          {feedLoading ? <p className="text-sm text-slate-700 dark:text-primary-100/80">Loading community feed...</p> : null}

          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const mediaCandidate = post.mediaUrl || detectFirstUrl(post.content);
              const comments = commentsByPost[post.id] ?? [];
              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-primary-50">
                        {post.author.avatarEmoji ?? "💚"} {post.author.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-primary-100/70">{formatDate(post.createdAt)}</p>
                    </div>
                    {post.milestone ? (
                      <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-800 dark:bg-secondary-400/20 dark:text-secondary-100">
                        Milestone
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-primary-50/95">{post.content}</p>

                  {post.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <button
                          type="button"
                          key={`${post.id}-${tag}`}
                          onClick={() => setSelectedTag(tag)}
                          className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-primary-100 dark:bg-primary-900/40 dark:text-primary-100 dark:hover:bg-primary-900/55"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {mediaCandidate ? <MediaPreview sourceUrl={mediaCandidate} /> : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleKudos(post.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        post.likedByViewer
                          ? "bg-success-100 text-success-800 dark:bg-success-500/25 dark:text-success-100"
                          : "border border-primary-300/40 bg-white text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
                      }`}
                    >
                      Kudos {post.kudosCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      className="rounded-full border border-primary-300/40 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
                    >
                      Comments {post.commentCount}
                    </button>
                  </div>

                  {expandedComments[post.id] ? (
                    <div className="mt-4 rounded-xl border border-primary-200/40 bg-primary-50/50 p-3 dark:border-primary-300/20 dark:bg-primary-900/20">
                      {commentLoading[post.id] ? (
                        <p className="text-xs text-slate-700 dark:text-primary-100/80">Loading comments...</p>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-slate-700 dark:text-primary-100/80">No comments yet. Start the conversation.</p>
                      ) : (
                        <div className="space-y-2">
                          {comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-lg border border-primary-200/40 bg-white px-3 py-2 dark:border-primary-300/20 dark:bg-primary-950/40"
                            >
                              <p className="text-xs font-semibold text-slate-900 dark:text-primary-50">
                                {comment.author.avatarEmoji ?? "💚"} {comment.author.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-800 dark:text-primary-100/90">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <input
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: event.target.value,
                            }))
                          }
                          placeholder="Write a comment"
                          className="min-w-0 flex-1 rounded-lg border border-primary-200/50 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/50 dark:text-primary-50 dark:placeholder:text-primary-100/60"
                        />
                        <button
                          type="button"
                          onClick={() => addComment(post.id)}
                          className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}

            {!feedLoading && filteredPosts.length === 0 ? (
              <p className="rounded-xl border border-primary-200/40 bg-white p-4 text-sm text-slate-700 dark:border-primary-300/20 dark:bg-primary-950/30 dark:text-primary-100/80">
                No posts match this filter yet. Publish the first feat.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "leaderboard" ? (
        <section className="mt-6 space-y-6 text-slate-950 dark:text-primary-100">
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-primary-200/40 bg-white p-5 text-slate-950 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30 dark:text-primary-100">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Your Global Percentile</h2>
              <p className="mt-2 text-xs text-slate-900 dark:text-primary-100/75">
                Percentile is computed from users who enabled comparison sharing.
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-4xl font-bold text-slate-950 dark:text-white">
                  {typeof compareData.globalPercentile?.stepsPercentile === "number"
                    ? `${compareData.globalPercentile.stepsPercentile}%`
                    : "--"}
                </p>
                <p className="pb-1 text-xs text-slate-900 dark:text-primary-100/70">
                  participants: {compareData.globalPercentile?.participantCount ?? 0}
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-primary-200/40 bg-white p-5 text-slate-950 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30 dark:text-primary-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">You vs Friend Average</h2>
                <div className="flex rounded-full border border-primary-200/50 bg-primary-50 p-1 text-slate-950 dark:border-primary-300/20 dark:bg-primary-950/50 dark:text-primary-100">
                  <button
                    type="button"
                    onClick={() => setCompareWindow("today")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      compareWindow === "today"
                        ? "bg-primary-600 text-white"
                        : "text-slate-950 dark:text-primary-100"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareWindow("week")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      compareWindow === "week"
                        ? "bg-primary-600 text-white"
                        : "text-slate-950 dark:text-primary-100"
                    }`}
                  >
                    This Week
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-3 text-xs text-slate-950 dark:text-primary-100/85">
                {[
                  {
                    label: "Steps",
                    you: ownTotals.steps,
                    avg: averageFriend.steps,
                    unit: "",
                  },
                  {
                    label: "Distance",
                    you: ownTotals.distanceMeters,
                    avg: averageFriend.distanceMeters,
                    unit: "m",
                  },
                  {
                    label: "Active Minutes",
                    you: ownTotals.activeMinutes,
                    avg: averageFriend.activeMinutes,
                    unit: "min",
                  },
                  {
                    label: "Heart Points",
                    you: ownTotals.heartPoints,
                    avg: averageFriend.heartPoints,
                    unit: "pts",
                  },
                ].map((metric) => {
                  const width = Math.min(100, Math.round((metric.you / Math.max(1, metric.you, metric.avg)) * 100));
                  return (
                    <div key={metric.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span>{metric.label}</span>
                        <span>
                          You {formatMetric(metric.you, metric.unit)} | Avg {formatMetric(metric.avg, metric.unit)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-primary-100 dark:bg-primary-200/15">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#10b981)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-primary-200/40 bg-white p-5 text-slate-950 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30 dark:text-primary-100">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Connections</h2>
              <form onSubmit={sendRequest} className="mt-3 flex flex-wrap gap-2">
                <input
                  value={friendEmail}
                  onChange={(event) => setFriendEmail(event.target.value)}
                  placeholder="Friend email"
                  className="min-w-55 flex-1 rounded-lg border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
                />
                <button
                  type="submit"
                  className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Send request
                </button>
              </form>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-primary-200/40 bg-primary-50/50 p-3 dark:border-primary-300/20 dark:bg-primary-950/35">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950 dark:text-primary-200/80">Incoming</p>
                  {friendsData.incoming.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-900 dark:text-primary-100/70">No incoming requests.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {friendsData.incoming.map((item) => (
                        <div key={item.requestId} className="rounded-lg border border-primary-200/40 bg-white p-2 dark:border-primary-300/20 dark:bg-primary-950/45">
                          <p className="text-sm font-semibold text-slate-950 dark:text-primary-50">
                            {item.from.avatarEmoji ?? "💚"} {item.from.name}
                          </p>
                          <p className="text-xs text-slate-800 dark:text-primary-100/70">{item.from.email ?? "No email"}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => respondRequest(item.requestId, "accept")}
                              className="rounded-full bg-success-500 px-3 py-1 text-xs font-semibold text-white"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => respondRequest(item.requestId, "decline")}
                              className="rounded-full border border-alert-300/40 px-3 py-1 text-xs font-semibold text-alert-700 dark:text-alert-200"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-primary-200/40 bg-primary-50/50 p-3 dark:border-primary-300/20 dark:bg-primary-950/35">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950 dark:text-primary-200/80">Connected Friends</p>
                  {friendsData.friends.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-900 dark:text-primary-100/70">No accepted connections yet.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {friendsData.friends.map((item) => (
                        <p key={item.requestId} className="text-sm text-slate-950 dark:text-primary-100">
                          {item.friend.avatarEmoji ?? "💚"} {item.friend.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {friendsData.outgoing.length > 0 ? (
                <p className="mt-3 text-xs text-slate-900 dark:text-primary-100/70">
                  Pending outgoing requests: {friendsData.outgoing.length}
                </p>
              ) : null}
            </article>

            <article className="rounded-2xl border border-primary-200/40 bg-white p-5 text-slate-950 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30 dark:text-primary-100">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Leaderboard</h2>
              <p className="mt-2 text-xs text-slate-900 dark:text-primary-100/70">
                Sorted by {compareWindow === "today" ? "today's" : "7-day"} step totals.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm text-slate-950 dark:text-primary-100">
                  <thead>
                    <tr>
                      <th className="border-b border-primary-200/40 px-2 py-2 text-left dark:border-primary-300/20">Person</th>
                      <th className="border-b border-primary-200/40 px-2 py-2 text-left dark:border-primary-300/20">Steps</th>
                      <th className="border-b border-primary-200/40 px-2 py-2 text-left dark:border-primary-300/20">Calories</th>
                      <th className="border-b border-primary-200/40 px-2 py-2 text-left dark:border-primary-300/20">Distance</th>
                      <th className="border-b border-primary-200/40 px-2 py-2 text-left dark:border-primary-300/20">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr key={`${row.name}-${row.isYou ? "self" : "friend"}`}>
                        <td className="border-b border-primary-200/30 px-2 py-2 font-medium dark:border-primary-300/10">
                          {row.avatarEmoji} {row.name}
                        </td>
                        <td className="border-b border-primary-200/30 px-2 py-2 dark:border-primary-300/10">{formatMetric(row.steps)}</td>
                        <td className="border-b border-primary-200/30 px-2 py-2 dark:border-primary-300/10">{formatMetric(row.caloriesKcal, "kcal")}</td>
                        <td className="border-b border-primary-200/30 px-2 py-2 dark:border-primary-300/10">{formatMetric(row.distanceMeters, "m")}</td>
                        <td className="border-b border-primary-200/30 px-2 py-2 dark:border-primary-300/10">{formatMetric(row.activeMinutes, "min")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {typeof compareData.blockedCount === "number" && compareData.blockedCount > 0 ? (
                <p className="mt-3 text-xs text-slate-900 dark:text-primary-100/70">
                  {compareData.blockedCount} friend profile(s) are hidden due to privacy settings.
                </p>
              ) : null}

              {leaderboard.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950 dark:text-primary-200/80">Steps Graph</p>
                  <div className="mt-2 space-y-2">
                    {leaderboard.slice(0, 8).map((row) => {
                      const width = maxStepValue > 0 ? Math.max(8, Math.round((row.steps / maxStepValue) * 100)) : 8;
                      return (
                        <div key={`${row.name}-${row.isYou ? "self" : "friend"}-bar`}>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-900 dark:text-primary-100/75">
                            <span>
                              {row.avatarEmoji} {row.name}
                            </span>
                            <span>{formatMetric(row.steps)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-primary-100 dark:bg-primary-200/15">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#10b981)]"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </article>
          </section>
        </section>
      ) : null}

      {tab === "challenges" ? (
        <section className="mt-6 space-y-6">
          <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Micro-Challenge</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-primary-100/80">
              Invite friends to short accountability challenges like weekend steps or active-minutes goals.
            </p>

            <form onSubmit={createChallenge} className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={challengeForm.title}
                  onChange={(event) => setChallengeForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Weekend Step Challenge"
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
                />
                <input
                  value={challengeForm.targetValue}
                  onChange={(event) => setChallengeForm((prev) => ({ ...prev, targetValue: event.target.value }))}
                  placeholder="10000"
                  type="number"
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
                />
              </div>

              <textarea
                value={challengeForm.description}
                onChange={(event) => setChallengeForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Optional challenge details"
                className="min-h-22.5 rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50 dark:placeholder:text-primary-100/60"
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={challengeForm.metricType}
                  onChange={(event) =>
                    setChallengeForm((prev) => ({
                      ...prev,
                      metricType: event.target.value as "steps" | "activeMinutes" | "waterMl",
                    }))
                  }
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50"
                >
                  <option value="steps">Steps</option>
                  <option value="activeMinutes">Active minutes</option>
                  <option value="waterMl">Water intake (ml)</option>
                </select>
                <input
                  type="date"
                  value={challengeForm.startDate}
                  onChange={(event) => setChallengeForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50"
                />
                <input
                  type="date"
                  value={challengeForm.endDate}
                  onChange={(event) => setChallengeForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="rounded-xl border border-primary-200/50 bg-white px-3 py-2 text-sm text-slate-900 dark:border-primary-300/20 dark:bg-primary-950/40 dark:text-primary-50"
                />
              </div>

              <div className="rounded-xl border border-primary-200/40 bg-primary-50/40 p-3 dark:border-primary-300/20 dark:bg-primary-900/15">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-800 dark:text-primary-200/85">Invite friends</p>
                {friendsData.friends.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-700 dark:text-primary-100/75">Connect with friends first to send challenge invites.</p>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {friendsData.friends.map((entry) => {
                      const checked = challengeForm.inviteUids.includes(entry.friend.uid);
                      return (
                        <label
                          key={entry.requestId}
                          className="flex items-center gap-2 rounded-lg border border-primary-200/40 bg-white px-3 py-2 text-sm text-slate-800 dark:border-primary-300/20 dark:bg-primary-950/45 dark:text-primary-100"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setChallengeForm((prev) => ({
                                ...prev,
                                inviteUids: event.target.checked
                                  ? [...prev.inviteUids, entry.friend.uid]
                                  : prev.inviteUids.filter((uid) => uid !== entry.friend.uid),
                              }));
                            }}
                          />
                          <span>
                            {entry.friend.avatarEmoji ?? "💚"} {entry.friend.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Create Challenge
                </button>
              </div>
            </form>
          </article>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Challenges</h3>
              {challengeLoading ? <p className="mt-3 text-sm text-slate-700 dark:text-primary-100/80">Loading challenges...</p> : null}
              {!challengeLoading && activeChallenges.length === 0 ? (
                <p className="mt-3 text-sm text-slate-700 dark:text-primary-100/80">No active challenges yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {activeChallenges.map((challenge) => {
                    const isParticipant = currentUid ? challenge.participantUids.includes(currentUid) : false;
                    const canJoin = currentUid ? challenge.inviteUids.includes(currentUid) : false;
                    return (
                      <div
                        key={challenge.id}
                        className="rounded-xl border border-primary-200/40 bg-primary-50/40 p-3 dark:border-primary-300/20 dark:bg-primary-950/45"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-primary-50">{challenge.title}</p>
                            <p className="text-xs text-slate-700 dark:text-primary-100/75">
                              {challenge.metricType} target: {formatMetric(challenge.targetValue)}
                            </p>
                          </div>
                          <span className="rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-semibold text-success-800 dark:bg-success-500/20 dark:text-success-100">
                            Active
                          </span>
                        </div>

                        {challenge.description ? (
                          <p className="mt-2 text-xs text-slate-800 dark:text-primary-100/85">{challenge.description}</p>
                        ) : null}

                        <p className="mt-2 text-xs text-slate-700 dark:text-primary-100/75">
                          {challenge.startDate} to {challenge.endDate}
                        </p>

                        <p className="mt-1 text-xs text-slate-700 dark:text-primary-100/75">
                          Participants: {challenge.participants.map((participant) => `${participant.avatarEmoji ?? "💚"} ${participant.name}`).join(", ") || "None"}
                        </p>

                        {canJoin && !isParticipant ? (
                          <button
                            type="button"
                            onClick={() => joinChallenge(challenge.id)}
                            className="mt-3 rounded-full bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                          >
                            Join challenge
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Completed Challenges</h3>
              {!challengeLoading && completedChallenges.length === 0 ? (
                <p className="mt-3 text-sm text-slate-700 dark:text-primary-100/80">Completed challenges will appear here.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {completedChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="rounded-xl border border-slate-300/60 bg-slate-50 p-3 dark:border-primary-300/20 dark:bg-primary-950/45"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-primary-50">{challenge.title}</p>
                          <p className="text-xs text-slate-700 dark:text-primary-100/75">
                            {challenge.metricType} target: {formatMetric(challenge.targetValue)}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-primary-300/20 dark:text-primary-100">
                          Completed
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-700 dark:text-primary-100/75">
                        {challenge.startDate} to {challenge.endDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </section>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-slate-700 dark:text-primary-100/80">Loading community hub...</p> : null}
    </main>
  );
}
