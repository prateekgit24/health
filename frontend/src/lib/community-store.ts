import { randomUUID } from "node:crypto";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { getProfilesByIds } from "@/lib/profile-store";
import { listFriendRequests } from "@/lib/friends-store";

const postsCollection = "communityPosts";
const commentsCollection = "communityPostComments";
const kudosCollection = "communityPostKudos";
const challengesCollection = "communityChallenges";

export type CommunityPostRecord = {
  id: string;
  authorUid: string;
  content: string;
  mediaUrl?: string;
  tags: string[];
  mentions: string[];
  milestone: boolean;
  kudosCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CommunityCommentRecord = {
  id: string;
  postId: string;
  authorUid: string;
  content: string;
  createdAt: string;
};

export type CommunityChallengeMetric = "steps" | "activeMinutes" | "waterMl";

export type CommunityChallengeRecord = {
  id: string;
  title: string;
  description?: string;
  metricType: CommunityChallengeMetric;
  targetValue: number;
  startDate: string;
  endDate: string;
  createdByUid: string;
  participantUids: string[];
  inviteUids: string[];
  status: "active" | "completed";
  createdAt: string;
  updatedAt: string;
};

function toPostRecord(data: unknown, id: string) {
  return {
    id,
    ...(data as Omit<CommunityPostRecord, "id">),
  };
}

function toCommentRecord(data: unknown, id: string) {
  return {
    id,
    ...(data as Omit<CommunityCommentRecord, "id">),
  };
}

function toChallengeRecord(data: unknown, id: string) {
  return {
    id,
    ...(data as Omit<CommunityChallengeRecord, "id">),
  };
}

function normalizeTag(input: string) {
  const trimmed = input.trim().toLowerCase().replace(/^#+/, "");
  return trimmed.replace(/[^a-z0-9-]/g, "").slice(0, 24);
}

function normalizeMention(input: string) {
  return input.trim().replace(/^@+/, "").toLowerCase().slice(0, 40);
}

function normalizeMediaUrl(input: string | undefined) {
  const raw = input?.trim();
  if (!raw) {
    return undefined;
  }

  if (raw.length > 500) {
    throw new Error("Media URL is too long.");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Media URL must be a valid absolute URL.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error("Only http/https media URLs are allowed.");
  }

  return parsed.toString();
}

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;
}

function extractTagsAndMentions(content: string, explicitTags?: string[]) {
  const tagMatches = content.match(/#[a-zA-Z0-9_-]+/g) ?? [];
  const mentionMatches = content.match(/@[a-zA-Z0-9._-]+/g) ?? [];

  const fromContent = tagMatches.map((tag) => normalizeTag(tag));
  const fromExplicit = (explicitTags ?? []).map((tag) => normalizeTag(tag));
  const tags = Array.from(new Set([...fromContent, ...fromExplicit].filter(Boolean))).slice(0, 6);
  const mentions = Array.from(new Set(mentionMatches.map((mention) => normalizeMention(mention)).filter(Boolean))).slice(0, 8);

  return { tags, mentions };
}

async function getFriendIds(uid: string) {
  const requests = await listFriendRequests(uid);
  return requests.accepted.map((item) => (item.fromUid === uid ? item.toUid : item.fromUid));
}

export async function listCommunityPosts(viewerUid: string, options?: { tag?: string; limit?: number }) {
  const requestedLimit = options?.limit ?? 25;
  const boundedLimit = Math.max(1, Math.min(50, requestedLimit));
  const requestedTag = options?.tag ? normalizeTag(options.tag) : "";

  const snapshot = await getFirebaseAdminDb()
    .collection(postsCollection)
    .orderBy("createdAt", "desc")
    .limit(boundedLimit)
    .get();

  const posts = snapshot.docs.map((doc) => toPostRecord(doc.data(), doc.id));
  const filtered = requestedTag ? posts.filter((post) => post.tags.includes(requestedTag)) : posts;

  const authorIds = Array.from(new Set(filtered.map((post) => post.authorUid)));
  const authors = await getProfilesByIds(authorIds);
  const authorMap = new Map(authors.map((author) => [author.id, author]));

  const likedPairs = await Promise.all(
    filtered.map(async (post) => {
      const likeDocId = `${post.id}_${viewerUid}`;
      const likeDoc = await getFirebaseAdminDb().collection(kudosCollection).doc(likeDocId).get();
      return [post.id, likeDoc.exists] as const;
    }),
  );

  const likedMap = new Map(likedPairs);

  return filtered.map((post) => {
    const author = authorMap.get(post.authorUid);
    return {
      ...post,
      likedByViewer: Boolean(likedMap.get(post.id)),
      author: {
        uid: post.authorUid,
        name: author?.name ?? "User",
        email: author?.email,
        avatarEmoji: author?.avatarEmoji,
      },
    };
  });
}

export async function createCommunityPost(input: {
  authorUid: string;
  content: string;
  mediaUrl?: string;
  milestone?: boolean;
  tags?: string[];
}) {
  const content = input.content.trim();
  if (content.length < 3) {
    throw new Error("Post must be at least 3 characters.");
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const mediaUrl = normalizeMediaUrl(input.mediaUrl);
  const { tags, mentions } = extractTagsAndMentions(content, input.tags);

  const record = compactUndefined({
    id,
    authorUid: input.authorUid,
    content: content.slice(0, 1200),
    mediaUrl,
    tags,
    mentions,
    milestone: Boolean(input.milestone),
    kudosCount: 0,
    commentCount: 0,
    createdAt: now,
    updatedAt: now,
  }) as CommunityPostRecord;

  await getFirebaseAdminDb().collection(postsCollection).doc(id).set(record);
  return record;
}

export async function togglePostKudos(input: { postId: string; uid: string }) {
  const postRef = getFirebaseAdminDb().collection(postsCollection).doc(input.postId);
  const likeDocId = `${input.postId}_${input.uid}`;
  const likeRef = getFirebaseAdminDb().collection(kudosCollection).doc(likeDocId);

  const result = await getFirebaseAdminDb().runTransaction(async (tx) => {
    const [postDoc, likeDoc] = await Promise.all([tx.get(postRef), tx.get(likeRef)]);
    if (!postDoc.exists) {
      throw new Error("Post not found.");
    }

    const post = toPostRecord(postDoc.data(), postDoc.id);
    const hasLiked = likeDoc.exists;

    if (hasLiked) {
      tx.delete(likeRef);
      tx.update(postRef, {
        kudosCount: Math.max(0, Number(post.kudosCount ?? 0) - 1),
        updatedAt: new Date().toISOString(),
      });

      return {
        likedByViewer: false,
        kudosCount: Math.max(0, Number(post.kudosCount ?? 0) - 1),
      };
    }

    tx.set(likeRef, {
      id: likeDocId,
      postId: input.postId,
      uid: input.uid,
      createdAt: new Date().toISOString(),
    });
    tx.update(postRef, {
      kudosCount: Number(post.kudosCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    return {
      likedByViewer: true,
      kudosCount: Number(post.kudosCount ?? 0) + 1,
    };
  });

  return result;
}

export async function listPostComments(postId: string, options?: { limit?: number }) {
  const requestedLimit = options?.limit ?? 40;
  const boundedLimit = Math.max(1, Math.min(80, requestedLimit));

  const snapshot = await getFirebaseAdminDb()
    .collection(commentsCollection)
    .where("postId", "==", postId)
    .limit(boundedLimit)
    .get();

  const comments = snapshot.docs
    .map((doc) => toCommentRecord(doc.data(), doc.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const authorIds = Array.from(new Set(comments.map((comment) => comment.authorUid)));
  const authors = await getProfilesByIds(authorIds);
  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return comments.map((comment) => {
    const author = authorMap.get(comment.authorUid);
    return {
      ...comment,
      author: {
        uid: comment.authorUid,
        name: author?.name ?? "User",
        avatarEmoji: author?.avatarEmoji,
      },
    };
  });
}

export async function addPostComment(input: { postId: string; authorUid: string; content: string }) {
  const content = input.content.trim();
  if (content.length < 1) {
    throw new Error("Comment cannot be empty.");
  }

  const postRef = getFirebaseAdminDb().collection(postsCollection).doc(input.postId);
  const commentRef = getFirebaseAdminDb().collection(commentsCollection).doc(randomUUID());

  const createdComment = await getFirebaseAdminDb().runTransaction(async (tx) => {
    const postDoc = await tx.get(postRef);
    if (!postDoc.exists) {
      throw new Error("Post not found.");
    }

    const post = toPostRecord(postDoc.data(), postDoc.id);
    const comment: CommunityCommentRecord = {
      id: commentRef.id,
      postId: input.postId,
      authorUid: input.authorUid,
      content: content.slice(0, 500),
      createdAt: new Date().toISOString(),
    };

    tx.set(commentRef, comment);
    tx.update(postRef, {
      commentCount: Number(post.commentCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });

    return comment;
  });

  return createdComment;
}

export async function listCommunityChallenges(uid: string) {
  const [asParticipant, asInvited] = await Promise.all([
    getFirebaseAdminDb()
      .collection(challengesCollection)
      .where("participantUids", "array-contains", uid)
      .get(),
    getFirebaseAdminDb()
      .collection(challengesCollection)
      .where("inviteUids", "array-contains", uid)
      .get(),
  ]);

  const mergedMap = new Map<string, CommunityChallengeRecord>();
  for (const doc of [...asParticipant.docs, ...asInvited.docs]) {
    const challenge = toChallengeRecord(doc.data(), doc.id);
    const nowDate = new Date().toISOString().slice(0, 10);
    const resolvedStatus = challenge.endDate < nowDate ? "completed" : challenge.status;
    mergedMap.set(doc.id, { ...challenge, status: resolvedStatus });
  }

  const challenges = Array.from(mergedMap.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const allUserIds = Array.from(
    new Set(
      challenges.flatMap((challenge) => [challenge.createdByUid, ...challenge.participantUids, ...challenge.inviteUids]),
    ),
  );
  const profiles = await getProfilesByIds(allUserIds);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return challenges.map((challenge) => ({
    ...challenge,
    createdBy: {
      uid: challenge.createdByUid,
      name: profileMap.get(challenge.createdByUid)?.name ?? "User",
      avatarEmoji: profileMap.get(challenge.createdByUid)?.avatarEmoji,
    },
    participants: challenge.participantUids.map((participantUid) => ({
      uid: participantUid,
      name: profileMap.get(participantUid)?.name ?? "User",
      avatarEmoji: profileMap.get(participantUid)?.avatarEmoji,
    })),
    invitees: challenge.inviteUids.map((inviteUid) => ({
      uid: inviteUid,
      name: profileMap.get(inviteUid)?.name ?? "User",
      avatarEmoji: profileMap.get(inviteUid)?.avatarEmoji,
    })),
  }));
}

export async function createCommunityChallenge(input: {
  uid: string;
  title: string;
  description?: string;
  metricType: CommunityChallengeMetric;
  targetValue: number;
  startDate: string;
  endDate: string;
  inviteUids: string[];
}) {
  const title = input.title.trim();
  if (title.length < 3) {
    throw new Error("Challenge title must be at least 3 characters.");
  }

  if (!Number.isFinite(input.targetValue) || input.targetValue <= 0) {
    throw new Error("Target value must be a positive number.");
  }

  if (!input.startDate || !input.endDate) {
    throw new Error("Start date and end date are required.");
  }

  if (input.endDate < input.startDate) {
    throw new Error("End date must be after start date.");
  }

  const friendIds = await getFriendIds(input.uid);
  const friendSet = new Set(friendIds);
  const inviteUids = Array.from(new Set(input.inviteUids.filter((id) => friendSet.has(id)))).slice(0, 20);

  const now = new Date().toISOString();
  const id = randomUUID();
  const trimmedDescription = input.description?.trim();
  const record = compactUndefined({
    id,
    title: title.slice(0, 80),
    description: trimmedDescription ? trimmedDescription.slice(0, 320) : undefined,
    metricType: input.metricType,
    targetValue: Number(input.targetValue),
    startDate: input.startDate,
    endDate: input.endDate,
    createdByUid: input.uid,
    participantUids: [input.uid],
    inviteUids,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }) as CommunityChallengeRecord;

  await getFirebaseAdminDb().collection(challengesCollection).doc(id).set(record);
  return record;
}

export async function joinCommunityChallenge(input: { challengeId: string; uid: string }) {
  const ref = getFirebaseAdminDb().collection(challengesCollection).doc(input.challengeId);
  const updated = await getFirebaseAdminDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) {
      throw new Error("Challenge not found.");
    }

    const challenge = toChallengeRecord(doc.data(), doc.id);
    const invited = challenge.inviteUids.includes(input.uid);
    const alreadyParticipant = challenge.participantUids.includes(input.uid);
    if (!invited && !alreadyParticipant) {
      throw new Error("You are not invited to this challenge.");
    }

    if (alreadyParticipant) {
      return challenge;
    }

    const participantUids = [...challenge.participantUids, input.uid];
    const inviteUids = challenge.inviteUids.filter((uid) => uid !== input.uid);
    const next = {
      ...challenge,
      participantUids,
      inviteUids,
      updatedAt: new Date().toISOString(),
    };

    tx.update(ref, {
      participantUids,
      inviteUids,
      updatedAt: next.updatedAt,
    });

    return next;
  });

  return updated;
}