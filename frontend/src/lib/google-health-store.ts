import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import type { GoogleHealthDailyMetric } from "@/lib/google-health-aggregate";

const stateCollection = "googleHealthOAuthStates";
const syncCollection = "googleHealthSyncs";

export type GoogleHealthSnapshot = {
  uid: string;
  syncedAt: string;
  startTimeMillis: number;
  endTimeMillis: number;
  steps: number;
  caloriesKcal: number;
  distanceMeters: number;
  activeMinutes: number;
  heartMinutes: number;
  avgHeartRateBpm?: number;
  confidence: "low" | "medium" | "high";
  dailyBuckets: GoogleHealthDailyMetric[];
  raw: unknown;
};

export async function createGoogleHealthOAuthState(uid: string) {
  const state = randomUUID();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000;

  await getFirebaseAdminDb().collection(stateCollection).doc(state).set({
    uid,
    createdAtMillis: now,
    expiresAtMillis: expiresAt,
  });

  return state;
}

export async function consumeGoogleHealthOAuthState(state: string) {
  const ref = getFirebaseAdminDb().collection(stateCollection).doc(state);
  const doc = await ref.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as { uid?: string; expiresAtMillis?: number };
  await ref.delete();

  if (!data.uid || !data.expiresAtMillis || Date.now() > data.expiresAtMillis) {
    return null;
  }

  return data.uid;
}

export async function saveGoogleHealthSnapshot(snapshot: GoogleHealthSnapshot) {
  await getFirebaseAdminDb().collection(syncCollection).doc(snapshot.uid).set(snapshot);
}

export async function getGoogleHealthSnapshot(uid: string) {
  const doc = await getFirebaseAdminDb().collection(syncCollection).doc(uid).get();
  if (!doc.exists) {
    return null;
  }

  return doc.data() as GoogleHealthSnapshot;
}
