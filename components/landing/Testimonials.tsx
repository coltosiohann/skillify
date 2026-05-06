"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const testimonials = [
  {
    initials: "MR",
    name: "Marcus Reid",
    role: "Product Manager, Stripe",
    text: "I went from knowing nothing about options trading to confidently executing strategies in 6 weeks. The AI somehow knew exactly what I needed to understand and in what order.",
  },
  {
    initials: "SK",
    name: "Shreya Kapoor",
    role: "CS Student, UC Berkeley",
    text: "I uploaded my university lecture notes and Skillify built a course around them. I used it to prep for my ML final. It's genuinely better than any online course I've taken.",
  },
  {
    initials: "JL",
    name: "Jamie Liu",
    role: "Founder, Ambient Studio",
    text: "The gamification doesn't feel childish — it actually makes me want to open the app every day. Three months in and I've completed 4 courses. That's more than the last 3 years on Coursera.",
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      style={{ padding: "96px 32px", background: "var(--background)" }}
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
              display: "inline-block",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--blue)",
              marginBottom: "14px",
            }}
          >
            From the Community
          </span>
          <h2
            style={{
              fontFamily: "var(--font-bricolage)",
              fontSize: "clamp(32px, 3.5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              color: "var(--foreground)",
            }}
          >
            People who actually use it.
          </h2>
        </motion.div>

        <div
          className="landing-testimonials-grid"
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "56px",
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: "easeOut" }}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "28px",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--blue-border)";
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = "0 12px 36px oklch(0 0 0 / 0.12)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Stars */}
              <div style={{ display: "flex", gap: "3px", marginBottom: "16px" }}>
                {[...Array(5)].map((_, j) => (
                  <span key={j} style={{ color: "var(--gold)", fontSize: "14px" }}>★</span>
                ))}
              </div>

              {/* Quote mark */}
              <div
                style={{
                  color: "var(--blue)",
                  fontFamily: "var(--font-bricolage)",
                  fontSize: "28px",
                  lineHeight: 0.8,
                  marginBottom: "6px",
                }}
              >
                &ldquo;
              </div>

              {/* Quote text */}
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "var(--foreground)",
                  marginBottom: "20px",
                  fontStyle: "italic",
                }}
              >
                {t.text}
              </p>

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "var(--muted-foreground)",
                    flexShrink: 0,
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
