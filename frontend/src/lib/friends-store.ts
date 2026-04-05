import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

const collectionName = "friendRequests";

type FriendRequestStatus = "pending" | "accepted" | "declined";

export type FriendRequestRecord = {
  id: string;
  fromUid: string;
  toUid: string;
  participants: [string, string];
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
};

function toRecord(data: unknown, id: string) {
  const item = data as Omit<FriendRequestRecord, "id">;
  return {
    id,
    ...item,
  };
}

export async function createFriendRequest(fromUid: string, toUid: string) {
  if (fromUid === toUid) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  const existingSameDirection = await getFirebaseAdminDb()
    .collection(collectionName)
    .where("fromUid", "==", fromUid)
    .where("toUid", "==", toUid)
    .where("status", "in", ["pending", "accepted"])
    .limit(1)
    .get();

  if (!existingSameDirection.empty) {
    throw new Error("A friend request already exists for this user.");
  }

  const existingReverseDirection = await getFirebaseAdminDb()
    .collection(collectionName)
    .where("fromUid", "==", toUid)
    .where("toUid", "==", fromUid)
    .where("status", "in", ["pending", "accepted"])
    .limit(1)
    .get();

  if (!existingReverseDirection.empty) {
    throw new Error("You already have a pending or accepted relationship with this user.");
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const record: FriendRequestRecord = {
    id,
    fromUid,
    toUid,
    participants: [fromUid, toUid],
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await getFirebaseAdminDb().collection(collectionName).doc(id).set(record);
  return record;
}

export async function listFriendRequests(uid: string) {
  const [incomingSnapshot, outgoingSnapshot, acceptedSnapshot] = await Promise.all([
    getFirebaseAdminDb()
      .collection(collectionName)
      .where("toUid", "==", uid)
      .where("status", "==", "pending")
      .get(),
    getFirebaseAdminDb()
      .collection(collectionName)
      .where("fromUid", "==", uid)
      .where("status", "==", "pending")
      .get(),
    getFirebaseAdminDb()
      .collection(collectionName)
      .where("participants", "array-contains", uid)
      .where("status", "==", "accepted")
      .get(),
  ]);

  const incoming = incomingSnapshot.docs.map((doc) => toRecord(doc.data(), doc.id));
  const outgoing = outgoingSnapshot.docs.map((doc) => toRecord(doc.data(), doc.id));
  const accepted = acceptedSnapshot.docs.map((doc) => toRecord(doc.data(), doc.id));

  return {
    incoming,
    outgoing,
    accepted,
  };
}

export async function respondToFriendRequest(
  uid: string,
  requestId: string,
  action: "accept" | "decline",
) {
  const ref = getFirebaseAdminDb().collection(collectionName).doc(requestId);
  const doc = await ref.get();

  if (!doc.exists) {
    throw new Error("Friend request not found.");
  }

  const current = toRecord(doc.data(), doc.id);

  if (current.toUid !== uid) {
    throw new Error("You are not allowed to respond to this request.");
  }

  if (current.status !== "pending") {
    throw new Error("Friend request is no longer pending.");
  }

  const status: FriendRequestStatus = action === "accept" ? "accepted" : "declined";
  const updatedAt = new Date().toISOString();

  await ref.update({ status, updatedAt });

  return {
    ...current,
    status,
    updatedAt,
  };
}
