import { randomUUID } from "node:crypto";
import type { UserProfile } from "@/lib/profile-types";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

const collectionName = "userProfiles";

function stripUndefinedDeep(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const cleanedEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, fieldValue]) => [key, stripUndefinedDeep(fieldValue)] as const)
      .filter(([, fieldValue]) => fieldValue !== undefined);

    if (cleanedEntries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(cleanedEntries);
  }

  return value;
}

export async function listProfiles() {
  const snapshot = await getFirebaseAdminDb().collection(collectionName).get();
  return snapshot.docs.map((doc) => doc.data() as UserProfile);
}

export async function getProfileById(id: string) {
  const doc = await getFirebaseAdminDb().collection(collectionName).doc(id).get();
  return doc.exists ? (doc.data() as UserProfile) : null;
}

export async function getProfileByEmail(email: string) {
  const normalized = email.trim();
  if (!normalized) {
    return null;
  }

  const snapshot = await getFirebaseAdminDb()
    .collection(collectionName)
    .where("email", "==", normalized)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].data() as UserProfile;
  }

  return null;
}

export async function getProfilesByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [] as UserProfile[];
  }

  const docs = await Promise.all(
    uniqueIds.map(async (id) => {
      const doc = await getFirebaseAdminDb().collection(collectionName).doc(id).get();
      return doc.exists ? (doc.data() as UserProfile) : null;
    }),
  );

  return docs.filter((item): item is UserProfile => Boolean(item));
}

export async function upsertProfile(
  input: Omit<UserProfile, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const now = new Date().toISOString();
  const id = input.id ?? randomUUID();
  const ref = getFirebaseAdminDb().collection(collectionName).doc(id);
  const existing = await ref.get();

  const rawProfile = {
    ...input,
    id,
    createdAt: existing.exists ? (existing.data() as UserProfile).createdAt : now,
    updatedAt: now,
  };

  const cleaned = stripUndefinedDeep(rawProfile);
  if (!cleaned || typeof cleaned !== "object") {
    throw new Error("Failed to sanitize profile payload");
  }

  const profile = cleaned as UserProfile;

  await ref.set(profile);
  return profile;
}
