import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Validates that a mutating request originates from our own app.
 * Compares the request Origin header against NEXT_PUBLIC_APP_URL.
 * Returns a 403 response if the origin is missing or doesn't match.
 *
 * Use on all POST/DELETE routes that change user data or initiate payments.
 */
export function validateOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const appOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;

  if (!origin || origin !== appOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
