import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";
import { createCommunityPost, listCommunityPosts } from "@/lib/community-store";
import { createCommunityPostPayloadSchema, firstSchemaError } from "@/lib/security/api-schemas";
import { checkRateLimit, getRequestIp } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const tag = url.searchParams.get("tag") ?? undefined;
    const posts = await listCommunityPosts(user.uid, { tag, limit: 25 });
    return NextResponse.json({ posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkRateLimit(`community:post:create:${user.uid}:${getRequestIp(request)}`, {
    windowMs: 60_000,
    maxRequests: 8,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many posts created too quickly. Please wait and try again." },
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

    const parsed = createCommunityPostPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json({ error: firstSchemaError(parsed.error) }, { status: 400 });
    }

    const payload = parsed.data;
    const post = await createCommunityPost({
      authorUid: user.uid,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      tags: payload.tags ?? [],
      milestone: Boolean(payload.milestone),
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
