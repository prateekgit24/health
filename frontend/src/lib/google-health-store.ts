import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import type { GoogleHealthDailyMetric } from "@/lib/google-health-aggregate";

const stateCollection = "googleHealthOAuthStates";
const syncCollection = "googleHealthSyncs";
const tokenCollection = "googleHealthTokens";

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

export async function saveGoogleHealthRefreshToken(uid: string, refreshToken: string) {
  await getFirebaseAdminDb().collection(tokenCollection).doc(uid).set({
    uid,
    refreshToken,
    updatedAtMillis: Date.now(),
  });
}

export async function deleteGoogleHealthData(uid: string) {
  const db = getFirebaseAdminDb();
  await db.collection(syncCollection).doc(uid).delete();
  await db.collection(tokenCollection).doc(uid).delete();
}

export async function getGoogleHealthRefreshToken(uid: string) {
  const doc = await getFirebaseAdminDb().collection(tokenCollection).doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  
  // 30 Days expiration enforcement
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  if (data?.updatedAtMillis && Date.now() - data.updatedAtMillis > THIRTY_DAYS_MS) {
    await deleteGoogleHealthData(uid); // Auto-forget
    return null;
  }

  return data?.refreshToken as string | undefined;
}
