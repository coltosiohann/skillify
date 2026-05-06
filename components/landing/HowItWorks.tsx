"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Tell us your goal",
    desc: "Type the skill you want to learn — anything from Python to chess to financial modeling. Add your level and timeline.",
  },
  {
    num: "02",
    title: "AI builds your path",
    desc: "Claude analyzes your input and generates a fully structured curriculum — modules, lessons, and learning objectives.",
  },
  {
    num: "03",
    title: "Learn at your pace",
    desc: "Work through rich AI-generated lessons with examples, code, quizzes, and curated resources. On any device.",
  },
  {
    num: "04",
    title: "Level up & certify",
    desc: "Earn XP, unlock badges, maintain your streak, and receive a shareable certificate when you complete the course.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{ padding: "96px 32px", background: "var(--background)" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
            The Process
          </span>
          <h2
            style={{
              fontFamily: "var(--font-bricolage)",
              fontSize: "clamp(32px, 3.5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              marginBottom: "14px",
              color: "var(--foreground)",
            }}
          >
            From idea to course<br />in four steps.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "2px",
            marginTop: "56px",
            position: "relative",
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: "absolute",
              top: "28px",
              left: "12.5%",
              right: "12.5%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--border), var(--border), transparent)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {steps.map((s, i) => (
            <div
              key={s.num}
              className="group"
              style={{
                background: "var(--card)",
                padding: "28px 24px 24px",
                borderRadius: i === 0 ? "14px 0 0 14px" : i === steps.length - 1 ? "0 14px 14px 0" : "0",
                border: "1px solid var(--border)",
                position: "relative",
                zIndex: 1,
                transition: "border-color 0.2s, transform 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--blue-border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "var(--blue-muted)",
                  border: "1px solid var(--blue-border)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-bricolage)",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "var(--blue)",
                  marginBottom: "18px",
                }}
              >
                {s.num}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-bricolage)",
                  fontSize: "17px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  letterSpacing: "-0.3px",
                  color: "var(--foreground)",
                }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--muted-foreground)", lineHeight: 1.65 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
