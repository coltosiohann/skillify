"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Zap, Flame, BookOpen } from "lucide-react";

interface Feature {
  tag: string;
  tagColor: string;
  heading: string;
  highlight: string;
  body: string;
  bullets: string[];
  mockup: React.ReactNode;
  reverse?: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function FeatureRow({ feature }: { feature: Feature }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className={`flex flex-col ${feature.reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}
    >
      {/* Text */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="flex-1 max-w-lg"
      >
        <motion.span
          variants={fadeUp}
          className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-5 border"
          style={{
            background: feature.tagColor + "15",
            borderColor: feature.tagColor + "30",
            color: feature.tagColor,
          }}
        >
          {feature.tag}
        </motion.span>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 leading-tight">
          {feature.heading.split(feature.highlight).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {feature.highlight}
                </span>
              )}
            </span>
          ))}
        </motion.h2>
        <motion.p variants={fadeUp} className="text-slate-500 leading-relaxed mb-7 text-lg">
          {feature.body}
        </motion.p>
        <motion.ul variants={stagger} className="flex flex-col gap-3.5">
          {feature.bullets.map((b) => (
            <motion.li key={b} variants={fadeUp} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(91,76,245,0.12)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#5B4CF5" }} />
              </div>
              <span className="font-medium text-slate-700 text-sm">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: "easeOut" as const, delay: 0.15 }}
        className="flex-1 flex justify-center"
      >
        {feature.mockup}
      </motion.div>
    </div>
  );
}

/* ---- Mockup components ---- */
function RoadmapMockup() {
  const steps = [
    { label: "Fundamentals", done: true, active: false },
    { label: "Core Concepts", done: false, active: true },
    { label: "Practical Projects", done: false, active: false },
    { label: "Advanced Topics", done: false, active: false },
  ];
  return (
    <div
      className="w-[300px] rounded-3xl p-6 overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 24px 60px rgba(91,76,245,0.14), 0 0 0 1px rgba(91,76,245,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="font-heading font-bold text-slate-900 text-sm">Your Learning Roadmap</p>
        <BookOpen className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="relative">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 rounded-full" style={{ background: "linear-gradient(180deg, #5B4CF5, #E2E8F0)" }} />
        <div className="flex flex-col gap-3.5">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2`}
                style={
                  s.done
                    ? { background: "#5B4CF5", borderColor: "#5B4CF5" }
                    : s.active
                    ? { background: "white", borderColor: "#5B4CF5", boxShadow: "0 0 0 4px rgba(91,76,245,0.15)" }
                    : { background: "white", borderColor: "#E2E8F0" }
                }
              >
                {s.done ? (
                  <span className="text-white text-xs font-bold">✓</span>
                ) : s.active ? (
                  <span className="w-2.5 h-2.5 rounded-full block" style={{ background: "#5B4CF5" }} />
                ) : (
                  <span className="text-slate-300 text-xs">{i + 1}</span>
                )}
              </div>
              <div
                className="flex-1 p-3 rounded-xl"
                style={
                  s.active
                    ? { background: "rgba(91,76,245,0.06)", border: "1px solid rgba(91,76,245,0.15)" }
                    : { background: "rgba(0,0,0,0.02)", border: "1px solid transparent" }
                }
              >
                <p
                  className="text-sm font-semibold"
                  style={
                    s.active
                      ? { color: "#5B4CF5" }
                      : s.done
                      ? { color: "#94A3B8", textDecoration: "line-through" }
                      : { color: "#1E293B" }
                  }
                >
                  {s.label}
                </p>
                {s.active && (
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 rounded-full" style={{ background: "linear-gradient(90deg, #5B4CF5, #818CF8)" }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamificationMockup() {
  return (
    <div
      className="w-[300px] rounded-3xl p-6 flex flex-col gap-4 overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 24px 60px rgba(91,76,245,0.14), 0 0 0 1px rgba(91,76,245,0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-slate-900 text-sm">Today&apos;s Progress</p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#FEF3C7", color: "#92400E" }}>
          <Flame className="w-3 h-3" />
          7 Day Streak
        </div>
      </div>

      {/* XP bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500">Level 3 — Intermediate</span>
          <span className="text-xs font-bold" style={{ color: "#5B4CF5" }}>1,240 XP</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #4338CA, #818CF8)" }}
            initial={{ width: "0%" }}
            whileInView={{ width: "62%" }}
            transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.3 }}
            viewport={{ once: true }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">760 XP to Level 4</p>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2">
        {["Understanding Chess Openings", "Analyzing Endgame Tactics"].map((t, i) => (
          <div
            key={t}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}
          >
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: i === 0 ? "#5B4CF5" : "white", border: i === 0 ? "none" : "2px solid #CBD5E1" }}
            >
              {i === 0 && <span className="text-white text-[9px] font-bold">✓</span>}
            </div>
            <p className="text-xs font-medium text-slate-700 leading-tight">{t}</p>
          </div>
        ))}
      </div>

      {/* Boss battle */}
      <div
        className="flex items-center justify-between p-3.5 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "1px solid rgba(245,158,11,0.20)" }}
      >
        <div>
          <p className="text-xs font-bold text-amber-900">Boss Battle Unlocked!</p>
          <p className="text-[10px] text-amber-700">Complete for 500 XP</p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}>
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
      </div>
    </div>
  );
}

function SkillInputMockup() {
  return (
    <div
      className="w-[300px] rounded-3xl p-6 flex flex-col gap-5 overflow-hidden"
      style={{
        background: "white",
        boxShadow: "0 24px 60px rgba(91,76,245,0.14), 0 0 0 1px rgba(91,76,245,0.08)",
      }}
    >
      {/* Header */}
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)" }}
        >
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <p className="font-heading font-bold text-slate-900 text-base">What&apos;s your next skill?</p>
        <p className="text-xs text-slate-400 mt-1">AI builds the perfect learning path.</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Your goal</p>
        <div
          className="w-full px-4 py-3 rounded-xl text-sm font-semibold"
          style={{
            background: "rgba(91,76,245,0.05)",
            border: "2px solid rgba(91,76,245,0.20)",
            color: "#1E293B",
          }}
        >
          Master Chess in 60 days ✦
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        className="w-full py-3 rounded-xl text-white font-bold text-sm cursor-pointer"
        style={{ background: "linear-gradient(135deg, #4338CA, #5B4CF5)", boxShadow: "0 4px 14px rgba(91,76,245,0.35)" }}
      >
        Generate My Course →
      </motion.button>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex gap-2 min-w-max">
          {["💻 Tech", "🏃 Fitness", "🌍 Language", "🎨 Creative", "📚 Academics"].map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{ background: "#F1F5F9", color: "#64748B" }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const features: Feature[] = [
  {
    tag: "AI Course Generator",
    tagColor: "#5B4CF5",
    heading: "Create Any Skill Path",
    highlight: "Skill Path",
    body: "Describe what you want to master. Our AI architect builds a personalized roadmap tailored to your current level and timeline — in under 30 seconds.",
    bullets: ["Domain-specific curriculum", "Adapts to your schedule", "Resources curated for your level"],
    mockup: <SkillInputMockup />,
  },
  {
    tag: "Progress Tracking",
    tagColor: "#059669",
    heading: "Turn Goals Into Daily Execution",
    highlight: "Daily Execution",
    body: "Daily focus, milestones, and visible progress — so you always know exactly what to do next. No more guessing, no more losing momentum.",
    bullets: ["Visual progress roadmap", "Module milestones + unlocks", "Daily time estimates"],
    mockup: <RoadmapMockup />,
    reverse: true,
  },
  {
    tag: "Gamification",
    tagColor: "#D97706",
    heading: "Progress That Feels Like a Game",
    highlight: "Like a Game",
    body: "Earn XP, build streaks, and unlock boss challenges as you level up. Learning has never been this addictive.",
    bullets: ["Earn XP on every lesson", "Daily streaks + badges", "Boss Battle challenges"],
    mockup: <GamificationMockup />,
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="py-28 px-4" style={{ background: "#F7F8FC" }}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border"
            style={{ background: "rgba(91,76,245,0.08)", borderColor: "rgba(91,76,245,0.20)", color: "#5B4CF5" }}
          >
            Features
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Everything you need to{" "}
            <span style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              actually learn
            </span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Not another content platform. A complete system built to get you from beginner to confident.
          </p>
        </div>

        <div className="flex flex-col gap-28">
          {features.map((f) => (
            <FeatureRow key={f.tag} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}
