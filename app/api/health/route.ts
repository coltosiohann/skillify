import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1).single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows — that's fine, the DB is up
      return NextResponse.json(
        { status: "degraded", reason: error.message, latencyMs: Date.now() - start },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: "ok", latencyMs: Date.now() - start },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        reason: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
