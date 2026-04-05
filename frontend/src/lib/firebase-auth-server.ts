import type { NextRequest } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

export type FirebaseUserSession = {
  uid: string;
  email?: string;
  name?: string;
};

export async function requireFirebaseUser(request: NextRequest): Promise<FirebaseUserSession | null> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}
