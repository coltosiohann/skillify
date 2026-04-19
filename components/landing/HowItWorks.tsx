"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageSquare, Cpu, BookOpen, Trophy } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Tell Us Your Goal",
    desc: "Enter any skill — Python, chess, Spanish, guitar. Add your timeline and daily availability.",
    accent: "#5B4CF5",
    glow: "rgba(91,76,245,0.25)",
    bg: "rgba(91,76,245,0.10)",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Builds Your Path",
    desc: "Our AI generates a structured course with modules, lessons, and curated resources in under 30 seconds.",
    accent: "#6366F1",
    glow: "rgba(99,102,241,0.25)",
    bg: "rgba(99,102,241,0.10)",
  },
  {
    icon: BookOpen,
    step: "03",
    title: "Learn at Your Pace",
    desc: "Follow your personalized roadmap. Complete lessons, take quizzes, and watch your progress grow.",
    accent: "#059669",
    glow: "rgba(5,150,105,0.25)",
    bg: "rgba(5,150,105,0.10)",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Level Up & Certify",
    desc: "Earn XP, beat Boss Battle challenges, and get your completion certificate when you master the skill.",
    accent: "#D97706",
    glow: "rgba(217,119,6,0.25)",
    bg: "rgba(217,119,6,0.10)",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="relative py-28 px-4 overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)" }} />
      {/* Decorative orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(91,76,245,0.12)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border" style={{ background: "rgba(91,76,245,0.15)", borderColor: "rgba(91,76,245,0.30)", color: "#818CF8" }}>
            How It Works
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            From Zero to Expert{" "}
            <span style={{ background: "linear-gradient(135deg, #818CF8, #C4B5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              in 4 Steps
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Build your own personalized course in ~30 seconds. No experience needed.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: "easeOut" as const }}
              className="relative flex flex-col rounded-2xl p-6 cursor-default group"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: `0 0 30px ${s.glow}` }} />

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-11 -right-3 w-6 h-px z-10" style={{ background: "rgba(129,140,248,0.25)" }} />
              )}

              {/* Step number */}
              <span
                className="text-xs font-black mb-4 block"
                style={{ color: s.accent, letterSpacing: "0.15em" }}
              >
                {s.step}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0"
                style={{ background: s.bg, border: `1px solid ${s.accent}30` }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.accent }} />
              </div>

              <h3 className="font-heading font-bold text-white mb-2 text-base">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
