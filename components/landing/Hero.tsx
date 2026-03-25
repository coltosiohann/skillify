"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const avatars = [
  { src: "https://i.pravatar.cc/40?img=1", alt: "User" },
  { src: "https://i.pravatar.cc/40?img=2", alt: "User" },
  { src: "https://i.pravatar.cc/40?img=3", alt: "User" },
  { src: "https://i.pravatar.cc/40?img=4", alt: "User" },
  { src: "https://i.pravatar.cc/40?img=5", alt: "User" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const floatAnim = {
  y: [0, -12, 0],
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
};

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background glow */}
      <div className="absolute inset-0 hero-glow sparkle-bg pointer-events-none" />
      {/* Decorative blobs */}
      <div className="absolute top-32 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-violet-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Copy */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start"
        >
          {/* Badge */}
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Learning
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={item}
            className="font-heading text-5xl sm:text-6xl font-extrabold leading-[1.08] text-foreground mb-5"
          >
            Tell Us What You Want to{" "}
            <span className="text-gradient">Master.</span>
            <br />
            We Build the{" "}
            <span className="relative inline-block">
              Plan.
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 100 6" fill="none" preserveAspectRatio="none">
                <path d="M0 5 Q50 0 100 5" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={item} className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
            A personalized roadmap for any skill — built for your level and timeline. Start learning in{" "}
            <strong className="text-foreground">30 seconds.</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-wrap items-center gap-3 mb-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full bg-primary hover:bg-[#6d28d9] text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40 active:scale-95 gap-2 cursor-pointer"
              >
                Build My Roadmap
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200 cursor-pointer"
              >
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={item} className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {avatars.map((a, i) => (
                <img
                  key={i}
                  src={a.src}
                  alt={a.alt}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
                <span className="text-sm font-semibold text-foreground ml-1">4.9</span>
              </div>
              <p className="text-xs text-muted-foreground">Join 10,000+ active learners</p>
            </div>
          </motion.div>

          <motion.p variants={item} className="mt-4 text-xs text-muted-foreground">
            3-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </motion.div>

        {/* Right — Phone mockup group */}
        <div className="relative flex justify-center items-end lg:items-center h-[500px] lg:h-[560px]">
          {/* Phone 1 — left (progress card) */}
          <motion.div
            initial={{ opacity: 0, x: -40, rotate: -6 }}
            animate={{ opacity: 1, x: 0, rotate: -6, ...(reduce ? {} : floatAnim) }}
            transition={{ duration: 0.7, ease: "easeOut" as const, delay: 0.3 }}
            className="absolute left-0 bottom-8 w-44 z-10"
          >
            <PhoneFrame>
              <ProgressCard />
            </PhoneFrame>
          </motion.div>

          {/* Phone 2 — center (generating) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -8, 0] }}
            transition={{ duration: 0.7, ease: "easeOut" as const, delay: 0.1, ...(reduce ? {} : { y: { duration: 5, repeat: Infinity, ease: "easeInOut" as const } }) }}
            className="relative z-20 w-52"
          >
            <PhoneFrame>
              <GeneratingCard />
            </PhoneFrame>
          </motion.div>

          {/* Phone 3 — right (course week view) */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 6 }}
            animate={{ opacity: 1, x: 0, rotate: 6, ...(reduce ? {} : { y: [0, -10, 0], transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.5 } }) }}
            transition={{ duration: 0.7, ease: "easeOut" as const, delay: 0.5 }}
            className="absolute right-0 bottom-8 w-44 z-10"
          >
            <PhoneFrame>
              <WeekViewCard />
            </PhoneFrame>
          </motion.div>

          {/* XP badge floating */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 20 }}
            className="absolute bottom-0 right-8 z-30"
          >
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#f59e0b] shadow-lg shadow-amber-400/40 text-white font-bold text-sm">
              <span>⚡</span>
              Boss Battle · 100 XP
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-[2.5rem] bg-[#1a1033] p-1.5 shadow-2xl shadow-primary/20 border border-white/10">
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />
      <div className="rounded-[2rem] overflow-hidden bg-white w-full aspect-[9/19]">
        {children}
      </div>
    </div>
  );
}

function ProgressCard() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#7c3aed] to-[#6d28d9] p-4 pt-8 flex flex-col gap-3">
      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Daily Focus</p>
      <div className="bg-white/10 rounded-2xl p-3">
        <p className="text-white/70 text-[9px] mb-1">Overall Progress</p>
        <p className="text-white font-bold text-2xl">18%</p>
        <p className="text-white/60 text-[9px] mb-2">Keep pushing!</p>
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full w-[18%] bg-white rounded-full" />
        </div>
        <p className="text-white/50 text-[9px] mt-1">18/100</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-3">
        <p className="text-white/60 text-[9px]">Current Milestone</p>
        <p className="text-white font-bold text-sm">Fundamentals</p>
        <div className="mt-2 px-2.5 py-1 bg-white/20 rounded-full text-center">
          <p className="text-white text-[9px] font-medium">Continue Journey →</p>
        </div>
      </div>
    </div>
  );
}

function GeneratingCard() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#f8f6ff] to-[#ede9fe] p-4 pt-8 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <span className="text-2xl">⚡</span>
      </div>
      <div className="text-center">
        <p className="font-heading font-bold text-foreground text-sm">Generating</p>
        <p className="text-primary font-semibold text-xs">Personalized Plan..</p>
      </div>
      <div className="flex gap-1 mt-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <div className="w-full">
        {["Analyzing domain...", "Building modules...", "Adding resources..."].map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.4 }}
            className="flex items-center gap-2 py-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <p className="text-[9px] text-muted-foreground">{t}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WeekViewCard() {
  const lessons = ["Getting Started", "Core Concepts", "Practice Exercise"];
  return (
    <div className="w-full h-full bg-white p-4 pt-8 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-foreground text-[11px]">Learn to cook chicken</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <p className="text-[9px] text-muted-foreground">Active · 7 Days Remaining</p>
      </div>
      <div className="w-full h-1 bg-gray-100 rounded-full">
        <div className="h-full w-1/3 bg-primary rounded-full" />
      </div>
      <p className="text-[10px] font-semibold text-foreground mt-1">Week View</p>
      <div className="flex flex-col gap-2">
        {lessons.map((l, i) => (
          <div key={l} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? "bg-primary" : "bg-gray-200"}`}>
              {i === 0 && <span className="text-white text-[8px]">✓</span>}
            </div>
            <div>
              <p className="text-[9px] font-medium text-foreground leading-tight">{l}</p>
              <p className="text-[8px] text-muted-foreground">5 min read</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
