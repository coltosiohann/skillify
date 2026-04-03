import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

/**
 * Parses and validates a JSON request body against a Zod schema.
 *
 * Usage:
 *   const result = await parseJsonBody(req, MySchema);
 *   if (result.error) return result.error;
 *   const { field1, field2 } = result.data;
 */
export async function parseJsonBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      ),
    };
  }

  return { data: result.data, error: null };
}
