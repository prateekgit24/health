"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

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

type CompareWindow = "today" | "week";

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

function safeNumber(value: number | undefined) {
  return Number.isFinite(value ?? NaN) ? Number(value) : 0;
}

function formatMetric(value: number | undefined, unit = "") {
  const formatted = Math.round(safeNumber(value)).toLocaleString();
  return unit ? `${formatted} ${unit}` : formatted;
}

export default function FriendsPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [compareWindow, setCompareWindow] = useState<CompareWindow>("week");
  const [friendsData, setFriendsData] = useState<FriendsApiData>({
    incoming: [],
    outgoing: [],
    friends: [],
  });
  const [compareData, setCompareData] = useState<CompareApiData>({
    ownSummary: null,
    entries: [],
  });

  const authedFetch = useCallback(async (input: string, init?: RequestInit) => {
    const firebaseAuth = getFirebaseAuth();
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return fetch(input, init);
    }

    const token = await currentUser.getIdToken();
    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, {
      ...init,
      headers,
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
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
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unexpected loading error";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }

      setAuthed(true);
      await loadData();
    });

    return () => unsub();
  }, [loadData]);

  const ownTotals = useMemo(() => {
    return pickMetrics(compareData.ownSummary, compareWindow);
  }, [compareData.ownSummary, compareWindow]);

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

  const maxStepValue = useMemo(
    () => leaderboard.reduce((max, row) => Math.max(max, row.steps), 0),
    [leaderboard],
  );

  const averageFriend = useMemo(() => {
    if (compareData.entries.length === 0) {
      return {
        steps: 0,
        caloriesKcal: 0,
        distanceMeters: 0,
        activeMinutes: 0,
        heartPoints: 0,
      };
    }

    const totals = compareData.entries.reduce(
      (acc, entry) => {
        acc.steps += safeNumber(entry.health?.steps);
        acc.caloriesKcal += safeNumber(entry.health?.caloriesKcal);
        acc.distanceMeters += safeNumber(entry.health?.distanceMeters);
        acc.activeMinutes += safeNumber(entry.health?.activeMinutes);
        acc.heartPoints += safeNumber(entry.health?.heartMinutes);
        return acc;
      },
      { steps: 0, caloriesKcal: 0, distanceMeters: 0, activeMinutes: 0, heartPoints: 0 },
    );

    if (compareWindow === "today") {
      const dailyTotals = compareData.entries.reduce(
        (acc, entry) => {
          acc.steps += safeNumber(entry.health?.dailySteps);
          acc.caloriesKcal += safeNumber(entry.health?.dailyCaloriesKcal);
          acc.distanceMeters += safeNumber(entry.health?.dailyDistanceMeters);
          acc.activeMinutes += safeNumber(entry.health?.dailyActiveMinutes);
          acc.heartPoints += safeNumber(entry.health?.dailyHeartPoints);
          return acc;
        },
        { steps: 0, caloriesKcal: 0, distanceMeters: 0, activeMinutes: 0, heartPoints: 0 },
      );

      return {
        steps: dailyTotals.steps / compareData.entries.length,
        caloriesKcal: dailyTotals.caloriesKcal / compareData.entries.length,
        distanceMeters: dailyTotals.distanceMeters / compareData.entries.length,
        activeMinutes: dailyTotals.activeMinutes / compareData.entries.length,
        heartPoints: dailyTotals.heartPoints / compareData.entries.length,
      };
    }

    return {
      steps: totals.steps / compareData.entries.length,
      caloriesKcal: totals.caloriesKcal / compareData.entries.length,
      distanceMeters: totals.distanceMeters / compareData.entries.length,
      activeMinutes: totals.activeMinutes / compareData.entries.length,
      heartPoints: totals.heartPoints / compareData.entries.length,
    };
  }, [compareData.entries, compareWindow]);

  async function sendRequest(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    const response = await authedFetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email: friendEmail }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Failed to send friend request");
      return;
    }

    setFriendEmail("");
    setMessage("Friend request sent.");
    await loadData();
  }

  async function respondRequest(requestId: string, action: "accept" | "decline") {
    setMessage(null);

    const response = await authedFetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Failed to update request");
      return;
    }

    setMessage(action === "accept" ? "Friend request accepted." : "Friend request declined.");
    await loadData();
  }

  if (!authed && !loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-6">
          <h1 className="text-3xl font-semibold text-emerald-50">Friends and Connections</h1>
          <p className="mt-2 text-sm text-emerald-100/80">Please login from the Profile page to manage friends and achievements.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-emerald-200/20 bg-emerald-950/25 p-6 sm:p-8">
        <h1 className="text-4xl font-semibold text-emerald-50">Friends and Connections</h1>
        <p className="mt-2 text-sm text-emerald-100/80">
          Build your network, compare progress safely, and view trend charts and global ranking.
        </p>
      </section>

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {message}
        </p>
      ) : null}

      {compareData.blockedReason ? (
        <p className="mt-4 rounded-xl border border-amber-300/35 bg-amber-100/10 p-3 text-sm text-amber-100">
          {compareData.blockedReason}
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Your Global Percentile</h2>
          <p className="mt-2 text-xs text-emerald-100/70">
            Percentile is computed from steps among users who enabled comparison sharing.
          </p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-4xl font-semibold text-emerald-50">
              {typeof compareData.globalPercentile?.stepsPercentile === "number"
                ? `${compareData.globalPercentile.stepsPercentile}%`
                : "--"}
            </p>
            <p className="pb-1 text-xs text-emerald-100/70">
              participants: {compareData.globalPercentile?.participantCount ?? 0}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-amber-200">You vs Friend Average</h2>
            <div className="flex rounded-full border border-emerald-100/30 bg-emerald-950/40 p-1">
              <button
                type="button"
                onClick={() => setCompareWindow("today")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  compareWindow === "today" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCompareWindow("week")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  compareWindow === "week" ? "bg-amber-300 text-zinc-900" : "text-emerald-100"
                }`}
              >
                This Week
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-3 text-xs text-emerald-100/80">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span>Steps</span>
                <span>You {formatMetric(ownTotals.steps)} | Avg {formatMetric(averageFriend.steps)}</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-200/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22c55e)]"
                  style={{ width: `${Math.min(100, Math.round((ownTotals.steps / Math.max(1, ownTotals.steps, averageFriend.steps)) * 100))}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span>Distance</span>
                <span>You {formatMetric(ownTotals.distanceMeters, "m")} | Avg {formatMetric(averageFriend.distanceMeters, "m")}</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-200/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22c55e)]"
                  style={{ width: `${Math.min(100, Math.round((ownTotals.distanceMeters / Math.max(1, ownTotals.distanceMeters, averageFriend.distanceMeters)) * 100))}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span>Active Minutes</span>
                <span>You {formatMetric(ownTotals.activeMinutes, "min")} | Avg {formatMetric(averageFriend.activeMinutes, "min")}</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-200/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22c55e)]"
                  style={{ width: `${Math.min(100, Math.round((ownTotals.activeMinutes / Math.max(1, ownTotals.activeMinutes, averageFriend.activeMinutes)) * 100))}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span>Heart Points</span>
                <span>You {formatMetric(ownTotals.heartPoints, "points")} | Avg {formatMetric(averageFriend.heartPoints, "points")}</span>
              </div>
              <div className="h-2 rounded-full bg-emerald-200/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22c55e)]"
                  style={{ width: `${Math.min(100, Math.round((ownTotals.heartPoints / Math.max(1, ownTotals.heartPoints, averageFriend.heartPoints)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Connections</h2>
          <form onSubmit={sendRequest} className="mt-3 flex flex-wrap gap-2">
            <input
              value={friendEmail}
              onChange={(event) => setFriendEmail(event.target.value)}
              placeholder="Friend email"
              className="min-w-[220px] flex-1 rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/55"
            />
            <button type="submit" className="rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-emerald-200">
              Send request
            </button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Incoming</p>
              {friendsData.incoming.length === 0 ? (
                <p className="mt-2 text-xs text-emerald-100/70">No incoming requests.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {friendsData.incoming.map((item) => (
                    <div key={item.requestId} className="rounded-lg border border-emerald-200/20 bg-emerald-950/45 p-2">
                      <p className="text-sm font-semibold text-emerald-50">
                        {item.from.avatarEmoji ?? "💚"} {item.from.name}
                      </p>
                      <p className="text-xs text-emerald-100/70">{item.from.email ?? "No email"}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => respondRequest(item.requestId, "accept")}
                          className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-zinc-900"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondRequest(item.requestId, "decline")}
                          className="rounded-full border border-emerald-100/35 px-3 py-1 text-xs font-semibold text-emerald-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-emerald-200/20 bg-emerald-950/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Connected friends</p>
              {friendsData.friends.length === 0 ? (
                <p className="mt-2 text-xs text-emerald-100/70">No accepted connections yet.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {friendsData.friends.map((item) => (
                    <p key={item.requestId} className="text-sm text-emerald-100">
                      {item.friend.avatarEmoji ?? "💚"} {item.friend.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {friendsData.outgoing.length > 0 ? (
            <p className="mt-3 text-xs text-emerald-100/70">Pending outgoing requests: {friendsData.outgoing.length}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-emerald-200/20 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Leaderboard</h2>
          <p className="mt-2 text-xs text-emerald-100/70">
            Sorted by {compareWindow === "today" ? "today's" : "7-day"} step totals.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm text-emerald-100">
              <thead>
                <tr>
                  <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Person</th>
                  <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Steps</th>
                  <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Calories</th>
                  <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Distance</th>
                  <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Active</th>
                  <th className="border-b border-emerald-200/20 px-2 py-2 text-left">Heart points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={`${row.name}-${row.isYou ? "self" : "friend"}`}>
                    <td className="border-b border-emerald-200/10 px-2 py-2 font-medium">
                      {row.avatarEmoji} {row.name}
                    </td>
                    <td className="border-b border-emerald-200/10 px-2 py-2">{formatMetric(row.steps)}</td>
                    <td className="border-b border-emerald-200/10 px-2 py-2">{formatMetric(row.caloriesKcal, "kcal")}</td>
                    <td className="border-b border-emerald-200/10 px-2 py-2">{formatMetric(row.distanceMeters, "m")}</td>
                    <td className="border-b border-emerald-200/10 px-2 py-2">{formatMetric(row.activeMinutes, "min")}</td>
                    <td className="border-b border-emerald-200/10 px-2 py-2">{formatMetric(row.heartPoints, "points")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {typeof compareData.blockedCount === "number" && compareData.blockedCount > 0 ? (
            <p className="mt-3 text-xs text-emerald-100/70">
              {compareData.blockedCount} friend profile(s) are hidden from comparison due to privacy settings.
            </p>
          ) : null}

          {leaderboard.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">Steps graph</p>
              <div className="mt-2 space-y-2">
                {leaderboard.slice(0, 8).map((row) => {
                  const width = maxStepValue > 0 ? Math.max(8, Math.round((row.steps / maxStepValue) * 100)) : 8;
                  return (
                    <div key={`${row.name}-${row.isYou ? "self" : "friend"}-bar`}>
                      <div className="mb-1 flex items-center justify-between text-xs text-emerald-100/75">
                        <span>{row.avatarEmoji} {row.name}</span>
                        <span>{formatMetric(row.steps)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-emerald-200/15">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#22c55e)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </section>

      {loading ? <p className="mt-6 text-sm text-emerald-100/80">Loading connections and leaderboard graphs...</p> : null}
    </main>
  );
}
