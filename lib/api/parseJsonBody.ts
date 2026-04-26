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

/**
 * Higher-order function that wraps a route handler with automatic body validation.
 *
 * Usage:
 *   export const POST = withValidation(MySchema, async (req, body) => {
 *     // body is fully typed and validated
 *   });
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, body: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = await parseJsonBody(req, schema);
    if (result.error) return result.error;
    return handler(req, result.data);
  };
}

/**
 * Validates query params against a Zod schema.
 *
 * Usage:
 *   const result = parseQueryParams(req, MySchema);
 *   if (result.error) return result.error;
 */
export function parseQueryParams<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid query parameters", details: result.error.flatten() },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}
