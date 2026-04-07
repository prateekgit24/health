import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import {
  createFriendRequest,
  listFriendRequests,
  respondToFriendRequest,
} from "@/lib/friends-store";
import { getProfileByEmail, getProfilesByIds } from "@/lib/profile-store";
import { firstSchemaError, friendRequestPayloadSchema, friendRespondPayloadSchema } from "@/lib/security/api-schemas";
import { checkRateLimit, getRequestIp } from "@/lib/security/rate-limit";

function toSafeProfile(profile: {
  id: string;
  name: string;
  email?: string;
  avatarEmoji?: string;
  compareOptIn?: boolean;
}) {
  return {
    uid: profile.id,
    name: profile.name,
    email: profile.email,
    avatarEmoji: profile.avatarEmoji,
    compareOptIn: Boolean(profile.compareOptIn),
  };
}

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await listFriendRequests(user.uid);

    const relatedIds = new Set<string>();
    for (const item of [...requests.incoming, ...requests.outgoing, ...requests.accepted]) {
      relatedIds.add(item.fromUid);
      relatedIds.add(item.toUid);
    }
    relatedIds.delete(user.uid);

    const profiles = await getProfilesByIds(Array.from(relatedIds));
    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const incoming = requests.incoming.map((requestItem) => {
      const fromProfile = profileMap.get(requestItem.fromUid);
      return {
        requestId: requestItem.id,
        createdAt: requestItem.createdAt,
        from: fromProfile
          ? toSafeProfile(fromProfile)
          : {
              uid: requestItem.fromUid,
              name: "User",
              email: undefined,
              avatarEmoji: undefined,
              compareOptIn: false,
            },
      };
    });

    const outgoing = requests.outgoing.map((requestItem) => {
      const toProfile = profileMap.get(requestItem.toUid);
      return {
        requestId: requestItem.id,
        createdAt: requestItem.createdAt,
        to: toProfile
          ? toSafeProfile(toProfile)
          : {
              uid: requestItem.toUid,
              name: "User",
              email: undefined,
              avatarEmoji: undefined,
              compareOptIn: false,
            },
      };
    });

    const friends = requests.accepted.map((requestItem) => {
      const friendId = requestItem.fromUid === user.uid ? requestItem.toUid : requestItem.fromUid;
      const friendProfile = profileMap.get(friendId);
      return {
        requestId: requestItem.id,
        connectedAt: requestItem.updatedAt,
        friend: friendProfile
          ? toSafeProfile(friendProfile)
          : {
              uid: friendId,
              name: "User",
              email: undefined,
              avatarEmoji: undefined,
              compareOptIn: false,
            },
      };
    });

    return NextResponse.json({ incoming, outgoing, friends });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load friends";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`friends:request:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many friend requests. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = friendRequestPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return NextResponse.json({ error: firstSchemaError(parsed.error) }, { status: 400 });
  }

  const email = parsed.data.email;

  const targetProfile = await getProfileByEmail(email);
  if (!targetProfile) {
    return NextResponse.json({ error: "No profile found for this email" }, { status: 404 });
  }

  try {
    const requestRecord = await createFriendRequest(user.uid, targetProfile.id);
    return NextResponse.json({ request: requestRecord });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create friend request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`friends:respond:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many actions. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = friendRespondPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return NextResponse.json({ error: firstSchemaError(parsed.error) }, { status: 400 });
  }

  try {
    const updated = await respondToFriendRequest(user.uid, parsed.data.requestId, parsed.data.action);
    return NextResponse.json({ request: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to respond to request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
