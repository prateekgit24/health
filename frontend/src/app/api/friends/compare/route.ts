import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { listFriendRequests } from "@/lib/friends-store";
import { getProfileById, getProfilesByIds, listProfiles } from "@/lib/profile-store";
import { getGoogleHealthSnapshot } from "@/lib/google-health-store";

function computePercentile(values: number[], ownValue: number) {
  if (values.length === 0) {
    return null;
  }

  if (values.length === 1) {
    return 100;
  }

  const below = values.filter((value) => value < ownValue).length;
  const equal = values.filter((value) => value === ownValue).length;
  return Math.round(((below + 0.5 * equal) / values.length) * 100);
}

function getLatestDailyStats(snapshot: Awaited<ReturnType<typeof getGoogleHealthSnapshot>>) {
  if (!snapshot?.dailyBuckets || snapshot.dailyBuckets.length === 0) {
    return {
      dailySteps: 0,
      dailyCaloriesKcal: 0,
      dailyDistanceMeters: 0,
      dailyActiveMinutes: 0,
      dailyHeartPoints: 0,
    };
  }

  const latest = [...snapshot.dailyBuckets].sort((a, b) => a.date.localeCompare(b.date)).at(-1);

  return {
    dailySteps: Number(latest?.steps ?? 0),
    dailyCaloriesKcal: Number(latest?.caloriesKcal ?? 0),
    dailyDistanceMeters: Number(latest?.distanceMeters ?? 0),
    dailyActiveMinutes: Number(latest?.activeMinutes ?? 0),
    dailyHeartPoints: Number(latest?.heartMinutes ?? 0),
  };
}

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ownProfile = await getProfileById(user.uid);
    if (!ownProfile) {
      return NextResponse.json({ entries: [], blockedReason: "Save profile first." });
    }

    const ownSnapshot = await getGoogleHealthSnapshot(user.uid);

    const allCompareProfiles = (await listProfiles()).filter((profile) => Boolean(profile.compareOptIn));
    const allSnapshots = await Promise.all(
      allCompareProfiles.map(async (profile) => ({
        profile,
        snapshot: await getGoogleHealthSnapshot(profile.id),
      })),
    );
    const rankedStepValues = allSnapshots
      .map((entry) => entry.snapshot?.steps)
      .filter((value): value is number => Number.isFinite(value));

    const globalPercentile = ownSnapshot
      ? {
          stepsPercentile: computePercentile(rankedStepValues, ownSnapshot.steps),
          participantCount: rankedStepValues.length,
        }
      : null;

    if (!ownProfile.compareOptIn) {
      const ownDaily = getLatestDailyStats(ownSnapshot);

      return NextResponse.json({
        entries: [],
        blockedReason: "Enable compare sharing in your profile to compare with friends.",
        ownSummary: ownSnapshot
          ? {
              steps: ownSnapshot.steps,
              caloriesKcal: ownSnapshot.caloriesKcal,
              distanceMeters: ownSnapshot.distanceMeters,
              activeMinutes: ownSnapshot.activeMinutes,
              heartMinutes: ownSnapshot.heartMinutes,
              dailySteps: ownDaily.dailySteps,
              dailyCaloriesKcal: ownDaily.dailyCaloriesKcal,
              dailyDistanceMeters: ownDaily.dailyDistanceMeters,
              dailyActiveMinutes: ownDaily.dailyActiveMinutes,
              dailyHeartPoints: ownDaily.dailyHeartPoints,
            }
          : null,
        globalPercentile,
      });
    }

    const requests = await listFriendRequests(user.uid);
    const friendIds = requests.accepted.map((requestItem) =>
      requestItem.fromUid === user.uid ? requestItem.toUid : requestItem.fromUid,
    );

    const friendProfiles = await getProfilesByIds(friendIds);
    const visibleProfiles = friendProfiles.filter((profile) => Boolean(profile.compareOptIn));

    const snapshots = await Promise.all(
      visibleProfiles.map(async (profile) => ({
        profile,
        snapshot: await getGoogleHealthSnapshot(profile.id),
      })),
    );

    const entries = snapshots.map(({ profile, snapshot }) => {
      const daily = getLatestDailyStats(snapshot);

      return {
        uid: profile.id,
        name: profile.name,
        email: profile.email,
        avatarEmoji: profile.avatarEmoji,
        compareOptIn: Boolean(profile.compareOptIn),
        connectedAt: requests.accepted.find((item) =>
          item.fromUid === user.uid ? item.toUid === profile.id : item.fromUid === profile.id,
        )?.updatedAt,
        health: snapshot
          ? {
              syncedAt: snapshot.syncedAt,
              steps: snapshot.steps,
              caloriesKcal: snapshot.caloriesKcal,
              distanceMeters: snapshot.distanceMeters,
              activeMinutes: snapshot.activeMinutes,
              heartMinutes: snapshot.heartMinutes,
              dailySteps: daily.dailySteps,
              dailyCaloriesKcal: daily.dailyCaloriesKcal,
              dailyDistanceMeters: daily.dailyDistanceMeters,
              dailyActiveMinutes: daily.dailyActiveMinutes,
              dailyHeartPoints: daily.dailyHeartPoints,
            }
          : null,
      };
    });

    const ownDaily = getLatestDailyStats(ownSnapshot);

    return NextResponse.json({
      ownSummary: ownSnapshot
        ? {
            steps: ownSnapshot.steps,
            caloriesKcal: ownSnapshot.caloriesKcal,
            distanceMeters: ownSnapshot.distanceMeters,
            activeMinutes: ownSnapshot.activeMinutes,
            heartMinutes: ownSnapshot.heartMinutes,
            dailySteps: ownDaily.dailySteps,
            dailyCaloriesKcal: ownDaily.dailyCaloriesKcal,
            dailyDistanceMeters: ownDaily.dailyDistanceMeters,
            dailyActiveMinutes: ownDaily.dailyActiveMinutes,
            dailyHeartPoints: ownDaily.dailyHeartPoints,
          }
        : null,
      globalPercentile,
      entries,
      blockedCount: friendProfiles.length - visibleProfiles.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build comparison feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
