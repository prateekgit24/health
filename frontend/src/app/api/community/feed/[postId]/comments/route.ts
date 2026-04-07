import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { addPostComment, listPostComments } from "@/lib/community-store";
import { createCommentPayloadSchema, firstSchemaError, routeIdParamSchema } from "@/lib/security/api-schemas";
import { checkRateLimit, getRequestIp } from "@/lib/security/rate-limit";

type RouteParams = {
  params: Promise<{ postId: string }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postId } = await context.params;
    const paramValidation = routeIdParamSchema.safeParse({ id: postId });
    if (!paramValidation.success) {
      return NextResponse.json({ error: firstSchemaError(paramValidation.error) }, { status: 400 });
    }

    const comments = await listPostComments(postId, { limit: 60 });
    return NextResponse.json({ comments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load comments";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`community:comment:create:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many comments submitted. Please wait and try again." },
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

    let rawPayload: unknown;
    try {
      rawPayload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const payloadValidation = createCommentPayloadSchema.safeParse(rawPayload);
    if (!payloadValidation.success) {
      return NextResponse.json({ error: firstSchemaError(payloadValidation.error) }, { status: 400 });
    }

    const comment = await addPostComment({
      postId,
      authorUid: user.uid,
      content: payloadValidation.data.content,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add comment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
