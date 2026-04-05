import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { normalizeRoutineDays, type RoutineDayPlan, type RoutinePlan, type RoutinePlanSource } from "@/lib/routines-types";

const collectionName = "routinePlans";

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function getCurrentWeekKey(now = new Date()) {
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  const dayIndex = cursor.getDay();
  cursor.setDate(cursor.getDate() - dayIndex);
  return cursor.toISOString().slice(0, 10);
}

function withWeeklyReset(plan: RoutinePlan, currentWeekKey: string) {
  const normalizedDays = normalizeRoutineDays(plan.days);
  const needsWeekReset = plan.weekKey !== currentWeekKey;

  if (!needsWeekReset) {
    return {
      changed: normalizedDays.length !== plan.days.length,
      plan: {
        ...plan,
        days: normalizedDays,
      } as RoutinePlan,
    };
  }

  return {
    changed: true,
    plan: {
      ...plan,
      weekKey: currentWeekKey,
      days: normalizedDays.map((day) => ({ ...day, status: "not-done" })),
      updatedAt: new Date().toISOString(),
    } as RoutinePlan,
  };
}

export async function listRoutinePlansByUser(userId: string) {
  const snapshot = await getFirebaseAdminDb().collection(collectionName).where("userId", "==", userId).get();
  const currentWeekKey = getCurrentWeekKey();

  const plans = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const raw = doc.data() as RoutinePlan;
      const { changed, plan } = withWeeklyReset(raw, currentWeekKey);

      if (changed) {
        await doc.ref.set(plan);
      }

      return plan;
    }),
  );

  return plans
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function getRoutinePlanById(planId: string) {
  const doc = await getFirebaseAdminDb().collection(collectionName).doc(planId).get();
  return doc.exists ? (doc.data() as RoutinePlan) : null;
}

export async function createRoutinePlan(input: {
  userId: string;
  name: string;
  goal?: string;
  source: RoutinePlanSource;
  days: Partial<RoutineDayPlan>[];
}) {
  const now = new Date().toISOString();
  const id = randomUUID();
  const weekKey = getCurrentWeekKey();

  const plan: RoutinePlan = stripUndefined({
    id,
    userId: input.userId,
    name: input.name.trim(),
    goal: input.goal?.trim() || undefined,
    source: input.source,
    days: normalizeRoutineDays(input.days),
    weekKey,
    createdAt: now,
    updatedAt: now,
  }) as RoutinePlan;

  await getFirebaseAdminDb().collection(collectionName).doc(id).set(plan);
  return plan;
}

export async function updateRoutinePlan(
  userId: string,
  planId: string,
  patch: {
    name?: string;
    goal?: string;
    days?: Partial<RoutineDayPlan>[];
  },
) {
  const ref = getFirebaseAdminDb().collection(collectionName).doc(planId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Routine plan not found.");
  }

  const existingPlan = existing.data() as RoutinePlan;
  if (existingPlan.userId !== userId) {
    throw new Error("You can only edit your own routine plans.");
  }

  const weekKey = getCurrentWeekKey();

  const next: RoutinePlan = stripUndefined({
    ...existingPlan,
    name: patch.name !== undefined ? patch.name.trim() : existingPlan.name,
    goal: patch.goal !== undefined ? patch.goal.trim() || undefined : existingPlan.goal,
    days: patch.days ? normalizeRoutineDays(patch.days) : existingPlan.days,
    weekKey,
    updatedAt: new Date().toISOString(),
  }) as RoutinePlan;

  await ref.set(next);
  return next;
}

export async function deleteRoutinePlan(userId: string, planId: string) {
  const ref = getFirebaseAdminDb().collection(collectionName).doc(planId);
  const existing = await ref.get();

  if (!existing.exists) {
    throw new Error("Routine plan not found.");
  }

  const existingPlan = existing.data() as RoutinePlan;
  if (existingPlan.userId !== userId) {
    throw new Error("You can only delete your own routine plans.");
  }

  await ref.delete();
}
