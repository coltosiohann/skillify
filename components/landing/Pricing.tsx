"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const plans = [
  {
    tier: "Free",
    price: "$0",
    per: null,
    desc: "Everything you need to get started.",
    cta: "Get started free",
    href: "/signup",
    featured: false,
    features: [
      { text: "2 AI courses per month", included: true },
      { text: "All lesson types", included: true },
      { text: "Basic quizzes", included: true },
      { text: "XP & streak tracking", included: true },
      { text: "PDF upload", included: false },
      { text: "Completion certificates", included: false },
      { text: "Course export", included: false },
    ],
  },
  {
    tier: "Pro",
    price: "$9",
    per: ".99/mo",
    desc: "For serious learners who want no limits.",
    cta: "Start Pro free trial",
    href: "/signup?plan=pro",
    featured: true,
    badge: "Most popular",
    features: [
      { text: "Unlimited AI courses", included: true },
      { text: "PDF upload & context", included: true },
      { text: "All quiz types", included: true },
      { text: "Completion certificates", included: true },
      { text: "Streak freeze (1/month)", included: true },
      { text: "Course export", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    tier: "Team",
    price: "$29",
    per: ".99/mo",
    desc: "For teams building a learning culture.",
    cta: "Start team trial",
    href: "/signup?plan=team",
    featured: false,
    features: [
      { text: "Up to 5 members", included: true },
      { text: "Shared course library", included: true },
      { text: "Team analytics dashboard", included: true },
      { text: "Admin controls", included: true },
      { text: "All Pro features", included: true },
      { text: "SSO & SCIM (coming)", included: true },
      { text: "Dedicated onboarding", included: true },
    ],
  },
];

export default function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="pricing"
      ref={ref}
      style={{ background: "oklch(0.065 0.012 255)", padding: "96px 32px" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ textAlign: "center" }}
        >
          <span
            style={{
              display: "inline-block", fontSize: "11px", fontWeight: 700,
              letterSpacing: "1px", textTransform: "uppercase",
              color: "var(--blue)", marginBottom: "14px",
            }}
          >
            Pricing
          </span>
          <h2
            style={{
              fontFamily: "var(--font-bricolage)",
              fontSize: "clamp(32px, 3.5vw, 48px)",
              fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1,
              color: "#fff", marginBottom: "12px",
            }}
          >
            Start free.<br />Scale when you&apos;re ready.
          </h2>
          <p style={{ fontSize: "17px", color: "oklch(0.60 0.01 255)", maxWidth: "560px", margin: "0 auto" }}>
            No credit card required. Free plan is free forever, not a trial.
          </p>
        </motion.div>

        <div
          className="landing-pricing-grid"
          style={{
            display: "grid",
            gap: "16px", marginTop: "56px", alignItems: "stretch",
          }}
        >
          {plans.map((plan, i) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: "easeOut" }}
              style={{
                borderRadius: "20px", padding: "32px",
                border: `1px solid ${plan.featured ? "var(--blue-border)" : "oklch(1 0 0 / 0.09)"}`,
                background: plan.featured ? "oklch(0.13 0.02 255)" : "oklch(0.11 0.015 255)",
                display: "flex", flexDirection: "column",
                position: "relative", overflow: "hidden",
                transition: "transform 0.2s",
                boxShadow: plan.featured ? "0 0 0 1px var(--blue-border), 0 24px 64px oklch(0.53 0.23 256 / 0.12)" : "none",
                cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: "absolute", top: "20px", right: "20px",
                    background: "var(--blue)", color: "#fff",
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.3px",
                    padding: "4px 10px", borderRadius: "99px",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "oklch(0.50 0.01 255)", marginBottom: "10px" }}>
                {plan.tier}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
                <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "42px", fontWeight: 800, letterSpacing: "-2px", color: "#fff" }}>
                  {plan.price}
                </span>
                {plan.per && (
                  <span style={{ fontSize: "14px", color: "oklch(0.50 0.01 255)" }}>{plan.per}</span>
                )}
              </div>

              <p style={{ fontSize: "14px", color: "oklch(0.50 0.01 255)", marginBottom: "24px" }}>
                {plan.desc}
              </p>

              <div style={{ height: "1px", background: "oklch(1 0 0 / 0.07)", marginBottom: "20px" }} />

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                {plan.features.map((f) => (
                  <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "oklch(0.75 0.01 255)" }}>
                    <div
                      style={{
                        width: "18px", height: "18px", borderRadius: "5px",
                        background: f.included ? "var(--emerald-muted)" : "oklch(1 0 0 / 0.04)",
                        border: `1px solid ${f.included ? "oklch(0.63 0.15 162 / 0.35)" : "oklch(1 0 0 / 0.08)"}`,
                        display: "grid", placeItems: "center",
                        fontSize: "10px",
                        color: f.included ? "var(--emerald)" : "oklch(0.40 0.01 255)",
                        flexShrink: 0,
                      }}
                    >
                      {f.included ? "✓" : "—"}
                    </div>
                    {f.text}
                  </div>
                ))}
              </div>

              <Link href={plan.href}>
                <button
                  style={{
                    width: "100%", padding: "12px", borderRadius: "14px",
                    fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
                    background: plan.featured ? "var(--blue)" : "oklch(1 0 0 / 0.07)",
                    color: plan.featured ? "#fff" : "oklch(0.75 0.01 255)",
                    border: `1px solid ${plan.featured ? "transparent" : "oklch(1 0 0 / 0.10)"}`,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = plan.featured ? "var(--blue-hover)" : "oklch(1 0 0 / 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = plan.featured ? "var(--blue)" : "oklch(1 0 0 / 0.07)";
                  }}
                >
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
