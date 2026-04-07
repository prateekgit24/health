import { NextRequest, NextResponse } from "next/server";
import { joinCommunityChallenge } from "@/lib/community-store";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { firstSchemaError, routeIdParamSchema } from "@/lib/security/api-schemas";
import { checkRateLimit, getRequestIp } from "@/lib/security/rate-limit";

type RouteParams = {
  params: Promise<{ challengeId: string }>;
};

export async function POST(request: NextRequest, context: RouteParams) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`community:challenge:join:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 15,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many join attempts. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const { challengeId } = await context.params;
    const paramValidation = routeIdParamSchema.safeParse({ id: challengeId });
    if (!paramValidation.success) {
      return NextResponse.json({ error: firstSchemaError(paramValidation.error) }, { status: 400 });
    }

    const challenge = await joinCommunityChallenge({ challengeId, uid: user.uid });
    return NextResponse.json({ challenge });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to join challenge";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
