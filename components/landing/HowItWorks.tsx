"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageSquare, Cpu, BookOpen, Trophy } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Tell Us Your Goal",
    desc: "Enter any skill or domain you want to master — from Python programming to guitar solos. Add your timeline and daily availability.",
    color: "bg-violet-100 text-primary",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Builds Your Path",
    desc: "Our AI analyzes your level, timeline, and learning style to generate a structured course with modules, lessons, and curated resources.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: BookOpen,
    step: "03",
    title: "Learn at Your Pace",
    desc: "Follow your personalized roadmap day by day. Complete lessons, take quizzes, and track your progress visually.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Level Up & Certify",
    desc: "Earn XP, unlock badges, beat Boss Battle challenges, and get your completion certificate when you master the skill.",
    color: "bg-amber-100 text-amber-600",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4 bg-[#faf9ff]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
            From Zero to <span className="text-gradient">Expert</span> in 4 Steps
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build your own course in ~30 seconds. No experience needed.
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
              className="relative bg-white rounded-2xl border border-primary/8 p-6 shadow-sm hover:shadow-md hover:shadow-primary/8 transition-all duration-200 cursor-default"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 w-6 h-0.5 bg-primary/20 z-10" />
              )}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground/50 mb-2 block">{s.step}</span>
              <h3 className="font-heading font-bold text-foreground mb-2 text-base">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
