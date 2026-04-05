import type { NextRequest } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase-auth-server";

export function isAdminEmail(email: string | undefined) {
  if (!email) {
    return false;
  }

  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length === 0) {
    return false;
  }

  return configured.includes(email.trim().toLowerCase());
}

export async function requireAdminUser(request: NextRequest) {
  const user = await requireFirebaseUser(request);
  if (!user) {
    return { status: 401 as const, error: "Unauthorized", user: null };
  }

  if (!isAdminEmail(user.email)) {
    return { status: 403 as const, error: "Admin access required", user: null };
  }

  return { status: 200 as const, error: null, user };
}
