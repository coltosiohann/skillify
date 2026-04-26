const isProd = process.env.NODE_ENV === "production";

export function logError(context: string, err: unknown, extra?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(`[${context}]`, message, { ...(extra ?? {}), stack });
}

export function logWarn(context: string, message: string, extra?: Record<string, unknown>) {
  if (!isProd) console.warn(`[${context}]`, message, extra ?? {});
}

// ─── Structured business event logging ───────────────────────────────────────
// Each event is a single JSON line for easy log aggregation / alerting.

type LogLevel = "info" | "warn" | "error";

interface EventPayload {
  event: string;
  userId?: string;
  [key: string]: unknown;
}

function logEvent(level: LogLevel, payload: EventPayload) {
  const entry = JSON.stringify({ level, ts: new Date().toISOString(), ...payload });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export const bizLog = {
  courseGenerationStarted(userId: string, domain: string, durationWeeks: number) {
    logEvent("info", { event: "course_generation_started", userId, domain, durationWeeks });
  },
  courseGenerationCompleted(userId: string, courseId: string, totalLessons: number) {
    logEvent("info", { event: "course_generation_completed", userId, courseId, totalLessons });
  },
  courseGenerationFailed(userId: string, reason: string) {
    logEvent("error", { event: "course_generation_failed", userId, reason });
  },
  stripeWebhookReceived(eventType: string, customerId?: string) {
    logEvent("info", { event: "stripe_webhook_received", eventType, customerId });
  },
  stripeWebhookFailed(eventType: string, reason: string) {
    logEvent("error", { event: "stripe_webhook_failed", eventType, reason });
  },
  subscriptionActivated(userId: string, subscriptionId: string, priceId: string) {
    logEvent("info", { event: "subscription_activated", userId, subscriptionId, priceId });
  },
  subscriptionCanceled(userId: string, subscriptionId: string) {
    logEvent("warn", { event: "subscription_canceled", userId, subscriptionId });
  },
  rateLimitTriggered(userId: string, prefix: string, limit: number) {
    logEvent("warn", { event: "rate_limit_triggered", userId, prefix, limit });
  },
};
