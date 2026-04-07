import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { togglePostKudos } from "@/lib/community-store";
import { firstSchemaError, routeIdParamSchema } from "@/lib/security/api-schemas";
import { checkRateLimit, getRequestIp } from "@/lib/security/rate-limit";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function POST(request: NextRequest, context: RouteParams) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`community:kudos:toggle:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many interactions. Please wait and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  try {
    const { postId } = await context.params;
    const paramValidation = routeIdParamSchema.safeParse({ id: postId });
    if (!paramValidation.success) {
      return NextResponse.json({ error: firstSchemaError(paramValidation.error) }, { status: 400 });
    }

    const result = await togglePostKudos({ postId, uid: user.uid });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update kudos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
