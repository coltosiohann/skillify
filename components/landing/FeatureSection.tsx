"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface Feature {
  tag: string;
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
        <motion.span variants={fadeUp} className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          {feature.tag}
        </motion.span>
        <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-4 leading-tight">
          {feature.heading.split(feature.highlight).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className="text-gradient">{feature.highlight}</span>}
            </span>
          ))}
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed mb-6">
          {feature.body}
        </motion.p>
        <motion.ul variants={stagger} className="flex flex-col gap-3">
          {feature.bullets.map((b) => (
            <motion.li key={b} variants={fadeUp} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground text-sm">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" as const, delay: 0.15 }}
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
    <div className="w-72 bg-white rounded-3xl shadow-xl shadow-primary/12 border border-primary/8 p-6">
      <p className="font-heading font-bold text-foreground mb-5 text-sm">Your Learning Roadmap</p>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
        <div className="flex flex-col gap-4">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                s.done
                  ? "bg-primary border-primary"
                  : s.active
                  ? "bg-white border-primary shadow-md shadow-primary/30"
                  : "bg-white border-gray-200"
              }`}>
                {s.done ? (
                  <span className="text-white text-xs">✓</span>
                ) : s.active ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
                ) : (
                  <span className="text-gray-300 text-xs">{i + 1}</span>
                )}
              </div>
              <div className={`flex-1 p-3 rounded-xl border transition-all ${
                s.active ? "bg-primary/5 border-primary/20" : "bg-gray-50/50 border-transparent"
              }`}>
                <p className={`text-sm font-medium ${s.active ? "text-primary" : s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {s.label}
                </p>
                {s.active && (
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
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
    <div className="w-72 bg-white rounded-3xl shadow-xl shadow-primary/12 border border-primary/8 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-foreground text-sm">Today&apos;s Progress</p>
        <div className="px-3 py-1 rounded-full bg-[#fef3c7] text-[#d97706] text-xs font-bold">🔥 7 Day Streak</div>
      </div>
      {/* XP bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Level 3 — Intermediate</span>
          <span className="text-xs font-semibold text-primary">1,240 XP</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full"
            initial={{ width: "0%" }}
            whileInView={{ width: "62%" }}
            transition={{ duration: 1.2, ease: "easeOut" as const, delay: 0.3 }}
            viewport={{ once: true }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">760 XP to Level 4</p>
      </div>
      {/* Tasks */}
      <div className="flex flex-col gap-2">
        {["Understanding Chess Openings", "Analyzing Endgame Tactics"].map((t, i) => (
          <div key={t} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-5 h-5 rounded-full flex-shrink-0 border-2 ${i === 0 ? "bg-primary border-primary" : "border-gray-300"}`}>
              {i === 0 && <span className="text-white text-[9px] flex items-center justify-center w-full h-full">✓</span>}
            </div>
            <p className="text-xs font-medium text-foreground leading-tight">{t}</p>
          </div>
        ))}
      </div>
      {/* Boss battle badge */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#fef3c7] to-[#fde68a] border border-[#f59e0b]/20">
        <div>
          <p className="text-xs font-bold text-[#92400e]">Boss Battle Unlocked!</p>
          <p className="text-[10px] text-[#b45309]">Complete for 500 XP</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center">
          <span className="text-white text-sm">⚡</span>
        </div>
      </div>
    </div>
  );
}

function SkillInputMockup() {
  return (
    <div className="w-72 bg-white rounded-3xl shadow-xl shadow-primary/12 border border-primary/8 p-6 flex flex-col gap-5">
      <div className="text-center">
        <p className="font-heading font-bold text-foreground text-base mb-1">What&apos;s your next <span className="text-gradient">triumph?</span></p>
        <p className="text-xs text-muted-foreground">Describe your ambition — AI builds the perfect path.</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">What do you want to learn?</p>
        <div className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-primary/3 text-sm text-foreground font-medium">
          Master Chess in 60 days
        </div>
      </div>
      <button className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/30 hover:bg-[#6d28d9] transition-colors cursor-pointer">
        → Next Step
      </button>
      {/* Category chips */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="flex gap-2 min-w-max">
          {["💻 Tech", "🏃 Fitness", "🌍 Language", "🎨 Creative", "📚 Academics"].map((c) => (
            <span key={c} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-muted-foreground whitespace-nowrap">
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
    heading: "Create Any Skill Path",
    highlight: "Skill Path",
    body: "Describe what you want to master. Our AI architect builds a personalized roadmap tailored to your current level and timeline — in under 30 seconds.",
    bullets: ["Domain-specific curriculum", "Adapts to your schedule", "Resources curated for your level"],
    mockup: <SkillInputMockup />,
  },
  {
    tag: "Progress Tracking",
    heading: "Turn Goals Into Daily Execution",
    highlight: "Daily Execution",
    body: "Daily focus, milestones, and visible progress — so you always know exactly what to do next. No more guessing.",
    bullets: ["Visual progress roadmap", "Module milestones + unlocks", "Daily time estimates"],
    mockup: <RoadmapMockup />,
    reverse: true,
  },
  {
    tag: "Gamification",
    heading: "Progress That Feels Like a Game",
    highlight: "Like a Game",
    body: "Earn XP, build streaks, and unlock boss challenges as you level up. Learning has never been this addictive.",
    bullets: ["Earn XP on every lesson", "Daily streaks + badges", "Boss Battle challenges"],
    mockup: <GamificationMockup />,
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-28">
        {features.map((f) => (
          <FeatureRow key={f.tag} feature={f} />
        ))}
      </div>
    </section>
  );
}
