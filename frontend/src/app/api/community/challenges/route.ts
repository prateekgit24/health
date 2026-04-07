import { NextRequest, NextResponse } from "next/server";
import {
  createCommunityChallenge,
  listCommunityChallenges,
} from "@/lib/community-store";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { createChallengePayloadSchema, firstSchemaError } from "@/lib/security/api-schemas";
import { checkRateLimit, getRequestIp } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const challenges = await listCommunityChallenges(user.uid);
    return NextResponse.json({ challenges });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load challenges";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`community:challenge:create:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many challenge create attempts. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    let rawPayload: unknown;
    try {
      rawPayload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const payloadValidation = createChallengePayloadSchema.safeParse(rawPayload);
    if (!payloadValidation.success) {
      return NextResponse.json({ error: firstSchemaError(payloadValidation.error) }, { status: 400 });
    }

    const payload = payloadValidation.data;

    const challenge = await createCommunityChallenge({
      uid: user.uid,
      title: payload.title,
      description: payload.description,
      metricType: payload.metricType,
      targetValue: payload.targetValue,
      startDate: payload.startDate,
      endDate: payload.endDate,
      inviteUids: payload.inviteUids ?? [],
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create challenge";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
