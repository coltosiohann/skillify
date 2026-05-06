"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ── Wizard Mockup ─────────────────────────────── */
function WizardMockup() {
  const wiz: React.CSSProperties = {
    borderRadius: "var(--radius-2xl, 28px)",
    overflow: "hidden",
    border: "1px solid var(--border)",
    boxShadow: "0 24px 64px oklch(0 0 0 / 0.25)",
    background: "var(--card)",
  };
  const stepStyle = (state: "done" | "active" | "idle"): React.CSSProperties => ({
    flex: 1, padding: "12px 0", textAlign: "center",
    fontSize: "11px", fontWeight: 600,
    color: state === "done" ? "var(--emerald)" : state === "active" ? "var(--blue)" : "var(--muted-foreground)",
    borderBottom: `2px solid ${state === "done" ? "var(--emerald)" : state === "active" ? "var(--blue)" : "transparent"}`,
  });

  return (
    <div style={wiz}>
      {/* Steps header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 0 }}>
          <div style={stepStyle("done")}>Goal</div>
          <div style={stepStyle("done")}>Materials</div>
          <div style={stepStyle("active")}>Level &amp; Context</div>
          <div style={stepStyle("idle")}>Schedule</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px" }}>
        <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "20px", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.4px" }}>
          What&apos;s your current level?
        </div>
        <div style={{ fontSize: "13px", color: "var(--muted-foreground)", marginBottom: "20px" }}>
          This shapes how the AI explains concepts and what it assumes you already know.
        </div>

        {/* Level chips */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "16px" }}>
          {["Complete beginner", "Some experience", "Intermediate", "Advanced"].map((chip) => (
            <div
              key={chip}
              style={{
                padding: "7px 14px", borderRadius: "99px", fontSize: "13px", fontWeight: 500,
                background: chip === "Some experience" ? "var(--blue-muted)" : "var(--background)",
                border: `1px solid ${chip === "Some experience" ? "var(--blue-border)" : "var(--border)"}`,
                color: chip === "Some experience" ? "oklch(0.72 0.18 256)" : "var(--muted-foreground)",
                cursor: "default",
              }}
            >
              {chip}
            </div>
          ))}
        </div>

        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "8px" }}>
          What will you use this for?
        </div>
        <input
          readOnly
          value="Building a personal finance dashboard"
          style={{
            width: "100%", padding: "13px 16px", borderRadius: "14px",
            background: "var(--background)", border: "2px solid var(--blue-border)",
            color: "var(--foreground)", fontSize: "15px", outline: "none",
            marginBottom: "12px", boxShadow: "0 0 0 4px var(--blue-muted)",
            fontFamily: "inherit",
          }}
        />

        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "8px" }}>
          Any constraints?
        </div>
        <input
          readOnly
          placeholder="e.g. I only have 20 mins a day, avoid theory-heavy content…"
          style={{
            width: "100%", padding: "13px 16px", borderRadius: "14px",
            background: "var(--background)", border: "1px solid var(--border)",
            color: "var(--foreground)", fontSize: "15px", outline: "none",
            marginBottom: "16px", fontFamily: "inherit",
          }}
        />

        <button
          style={{
            width: "100%", padding: "12px", borderRadius: "14px",
            background: "var(--blue)", color: "#fff", fontSize: "14px",
            fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Continue to Schedule →
        </button>
      </div>
    </div>
  );
}

/* ── Roadmap Mockup ──────────────────────────────── */
function RoadmapMockup() {
  return (
    <div
      style={{
        borderRadius: "var(--radius-2xl, 28px)", overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "0 24px 64px oklch(0 0 0 / 0.25)",
        background: "var(--card)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "16px", fontWeight: 700, marginBottom: "3px" }}>
          React Fundamentals
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "12px" }}>
          4 modules · 18 lessons · 5.2 hrs · 1,240 XP total
        </div>
        <div style={{ height: "6px", borderRadius: "4px", background: "var(--muted)" }}>
          <div style={{ height: "100%", borderRadius: "4px", background: "var(--blue)", width: "42%" }} />
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "5px" }}>
          42% complete · Module 2 in progress
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 20px" }}>
        {/* Module 1 — done */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginBottom: "8px", background: "var(--background)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "var(--emerald-muted)", border: "1px solid oklch(0.63 0.15 162 / 0.35)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 800, color: "var(--emerald)" }}>✓</div>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Module 1: Foundations</span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "99px", background: "var(--emerald-muted)", color: "var(--emerald)" }}>Complete</span>
          </div>
        </div>

        {/* Module 2 — in progress */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginBottom: "8px", background: "var(--background)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "var(--blue-muted)", border: "1px solid var(--blue-border)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 800, color: "var(--blue)" }}>2</div>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Module 2: Components &amp; Props</span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "99px", background: "var(--blue-muted)", color: "oklch(0.72 0.18 256)" }}>In Progress</span>
          </div>
          {/* Lessons */}
          {[
            { name: "What is a Component?", xp: "+60 XP", done: true },
            { name: "JSX Syntax Deep Dive", xp: "+80 XP", done: true },
            { name: "Hooks & State Management", xp: "+100 XP", active: true },
            { name: "Passing Props Effectively", xp: "+80 XP", done: false },
          ].map((l) => (
            <div
              key={l.name}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 16px 9px 20px",
                borderTop: `1px solid ${l.active ? "var(--blue-border)" : "var(--border)"}`,
                fontSize: "12px",
                background: l.active ? "var(--blue-muted)" : "transparent",
              }}
            >
              <div style={{
                width: "16px", height: "16px", borderRadius: "50%",
                border: l.done ? "none" : l.active ? "1.5px solid var(--blue)" : "1.5px solid var(--border)",
                background: l.done ? "var(--emerald)" : "transparent",
                flexShrink: 0, display: "grid", placeItems: "center",
                fontSize: "9px", color: "#fff", fontWeight: 700,
              }}>
                {l.done ? "✓" : ""}
              </div>
              <div style={{
                flex: 1, color: l.done ? "var(--muted-foreground)" : l.active ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: l.active ? 600 : 400,
                textDecoration: l.done ? "line-through" : "none",
              }}>
                {l.name}
              </div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--gold)" }}>{l.xp}</div>
            </div>
          ))}
        </div>

        {/* Module 3 — locked */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "var(--background)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "var(--muted)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 800, color: "var(--muted-foreground)" }}>3</div>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Module 3: State &amp; Lifecycle</span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Gamification Mockup ─────────────────────────── */
function GamificationMockup() {
  const badges = [
    { emoji: "⚡", name: "First Steps", type: "gold" },
    { emoji: "🔥", name: "On Fire", type: "earned" },
    { emoji: "📚", name: "Dedicated", type: "earned" },
    { emoji: "🎖", name: "Power Up", type: "gold" },
    { emoji: "🗓", name: "Week Warrior", type: "earned" },
    { emoji: "🎓", name: "Graduate", type: "earned" },
    { emoji: "🏆", name: "XP Legend", type: "locked" },
    { emoji: "👑", name: "Unstoppable", type: "locked" },
  ];

  return (
    <div
      style={{
        borderRadius: "var(--radius-2xl, 28px)", overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "0 24px 64px oklch(0 0 0 / 0.25)",
        background: "var(--card)",
        padding: "24px",
      }}
    >
      {/* Level row */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <div
          style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "var(--gold-muted)", border: "2px solid oklch(0.76 0.16 75 / 0.35)",
            display: "grid", placeItems: "center", fontSize: "24px", flexShrink: 0,
          }}
        >
          🎓
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "16px", fontWeight: 800, letterSpacing: "-0.3px" }}>
            Scholar
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "6px" }}>
            3,840 XP · 3,160 to Master
          </div>
          <div style={{ height: "6px", borderRadius: "4px", background: "var(--muted)" }}>
            <div style={{ height: "100%", borderRadius: "4px", background: "var(--gold)", width: "72%" }} />
          </div>
        </div>
      </div>

      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" as const, color: "var(--muted-foreground)", marginBottom: "10px" }}>
        Badges Earned
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {badges.map((b) => (
          <div
            key={b.name}
            style={{
              aspectRatio: "1",
              borderRadius: "12px",
              display: "flex", flexDirection: "column" as const,
              alignItems: "center", justifyContent: "center",
              gap: "5px", padding: "10px 6px",
              textAlign: "center" as const,
              fontSize: "9px", fontWeight: 600,
              border: "1px solid",
              borderColor: b.type === "gold" ? "oklch(0.76 0.16 75 / 0.35)" : b.type === "earned" ? "var(--blue-border)" : "var(--border)",
              background: b.type === "gold" ? "var(--gold-muted)" : b.type === "earned" ? "var(--card)" : "var(--background)",
              opacity: b.type === "locked" ? 0.38 : 1,
              filter: b.type === "locked" ? "grayscale(0.8)" : "none",
              cursor: "default",
            }}
          >
            <span style={{ fontSize: "20px" }}>{b.emoji}</span>
            <span style={{ color: "var(--muted-foreground)", lineHeight: 1.2 }}>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feature Row ─────────────────────────────────── */
interface FeatRowProps {
  bg: string;
  label: string;
  heading: string;
  body: string;
  pills: { text: string; dot: "blue" | "gold" | "emerald" }[];
  mockup: React.ReactNode;
  flip?: boolean;
  id?: string;
}

function FeatRow({ bg, label, heading, body, pills, mockup, flip, id }: FeatRowProps) {
  const ref = useRef(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-80px" });

  const dotColor = { blue: "var(--blue)", gold: "var(--gold)", emerald: "var(--emerald)" };

  return (
    <section id={id} style={{ background: bg, padding: "80px 32px" }}>
      <div
        ref={ref}
        style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "80px", alignItems: "center",
          direction: flip ? "rtl" : "ltr",
        }}
      >
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: flip ? 32 : -32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ direction: "ltr" }}
        >
          <span
            style={{
              display: "block", fontSize: "11px", fontWeight: 700,
              letterSpacing: "1px", textTransform: "uppercase",
              color: "var(--blue)", marginBottom: "14px",
            }}
          >
            {label}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-bricolage)",
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.12,
              marginBottom: "16px", color: "var(--foreground)",
            }}
            dangerouslySetInnerHTML={{ __html: heading }}
          />
          <p style={{ fontSize: "16px", color: "var(--muted-foreground)", lineHeight: 1.75, marginBottom: "24px" }}>
            {body}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
            {pills.map((p) => (
              <span
                key={p.text}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "99px",
                  background: "var(--card)", border: "1px solid var(--border)",
                  fontSize: "13px", fontWeight: 500, color: "var(--muted-foreground)",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor[p.dot], flexShrink: 0, display: "inline-block" }} />
                {p.text}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, x: flip ? -32 : 32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          style={{ direction: "ltr" }}
        >
          {mockup}
        </motion.div>
      </div>
    </section>
  );
}

export default function FeatureSection() {
  return (
    <>
      <FeatRow
        id="features"
        bg="var(--card)"
        label="AI Course Generator"
        heading="Any skill. Any level.<br/>Built in 30 seconds."
        body="Describe what you want to learn and Skillify's AI constructs a full, structured course from scratch — tailored to your background, time constraints, and learning style. No templates. No shortcuts."
        pills={[
          { text: "Adapts to your level", dot: "blue" },
          { text: "PDF context upload", dot: "blue" },
          { text: "Powered by Claude AI", dot: "blue" },
          { text: "Real-time generation", dot: "emerald" },
        ]}
        mockup={<WizardMockup />}
      />

      <FeatRow
        bg="var(--background)"
        label="Your Learning Map"
        heading="See the full terrain<br/>before you start."
        body="Every course comes with a structured roadmap — modules, lessons, difficulty markers, time estimates, and XP rewards. Know exactly where you are and what's next at all times."
        pills={[
          { text: "Visual progress tracking", dot: "emerald" },
          { text: "XP per lesson", dot: "gold" },
          { text: "Module quizzes", dot: "blue" },
        ]}
        mockup={<RoadmapMockup />}
        flip
      />

      <FeatRow
        bg="var(--card)"
        label="Gamification"
        heading="Earn as you learn.<br/>Feel the progress."
        body="XP, levels, streaks, badges, and a global leaderboard — all designed to feel like meaningful signals, not distractions. Skillify's gamification rewards real depth, not busywork."
        pills={[
          { text: "7 level tiers", dot: "gold" },
          { text: "12 unlock badges", dot: "gold" },
          { text: "Global leaderboard", dot: "blue" },
          { text: "Completion certificates", dot: "emerald" },
        ]}
        mockup={<GamificationMockup />}
      />
    </>
  );
}
