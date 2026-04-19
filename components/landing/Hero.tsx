"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star, Zap, CheckCircle } from "lucide-react";

const avatars = [
  "https://i.pravatar.cc/40?img=1",
  "https://i.pravatar.cc/40?img=2",
  "https://i.pravatar.cc/40?img=3",
  "https://i.pravatar.cc/40?img=4",
  "https://i.pravatar.cc/40?img=5",
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

/* ── Phone frame wrapper ── */
function Phone({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 ${className}`}
      style={{
        borderRadius: "2.8rem",
        border: "3.5px solid #1E1B4B",
        boxShadow: "0 32px 80px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,0.10)",
        ...style,
      }}
    >
      {/* Dynamic Island / notch */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
        style={{ width: "72px", height: "20px", background: "#1E1B4B", borderRadius: "12px" }}
      />
      {children}
    </div>
  );
}

/* ── Left phone — Daily Focus (purple) ── */
function PhoneLeft() {
  return (
    <Phone className="w-[210px] h-[390px]" style={{ background: "linear-gradient(160deg, #5B4CF5 0%, #4338CA 100%)" }}>
      <div className="pt-14 px-5 pb-5 flex flex-col h-full">
        <p className="text-[9px] font-black uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>Daily Focus</p>

        <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(255,255,255,0.12)" }}>
          <p className="text-[10px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>Overall Progress</p>
          <p className="font-heading font-extrabold text-4xl text-white leading-none mb-1">18%</p>
          <p className="text-[10px] mb-2.5" style={{ color: "rgba(255,255,255,0.50)" }}>Keep pushing!</p>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.20)" }}>
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: "18%" }}
              transition={{ delay: 1.0, duration: 1.0, ease: "easeOut" as const }}
            />
          </div>
          <p className="text-[9px] mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>18/100</p>
        </div>

        <div className="rounded-2xl p-4 flex-1 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.60)" }}>Current Milestone</p>
            <p className="font-heading font-bold text-lg text-white">Fundamentals</p>
          </div>
          <button
            className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold cursor-pointer"
            style={{ background: "white", color: "#4338CA" }}
          >
            Continue Journey →
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── Center phone — AI Generating (white) ── */
function PhoneCenter() {
  return (
    <Phone className="w-[240px] h-[440px]" style={{ background: "white" }}>
      <div className="pt-14 px-5 pb-6 flex flex-col items-center h-full justify-center gap-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(91,76,245,0.08)", border: "1.5px solid rgba(91,76,245,0.15)" }}
        >
          <Zap className="w-10 h-10" style={{ color: "#5B4CF5" }} />
        </div>

        <div className="text-center">
          <p className="font-heading font-bold text-lg text-slate-900 leading-tight">Generating</p>
          <p className="font-heading font-bold text-lg leading-tight" style={{ color: "#5B4CF5" }}>Personalized Plan..</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#5B4CF5" }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        <div className="w-full flex flex-col gap-2.5 mt-1">
          {["Analyzing domain...", "Building modules...", "Adding resources..."].map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.35 }}
              className="flex items-center gap-2.5 text-sm font-medium"
              style={{ color: "#64748B" }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#5B4CF5" }} />
              {t}
            </motion.div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

/* ── Right phone — Course view (light) ── */
function PhoneRight() {
  const lessons = [
    { title: "Getting Started", time: "5 min read", done: true },
    { title: "Core Concepts", time: "5 min read", done: false },
    { title: "Practice Exercise", time: "5 min read", done: false },
  ];
  return (
    <Phone className="w-[210px] h-[380px]" style={{ background: "#F8FAFC" }}>
      <div className="pt-14 px-4 pb-5 flex flex-col h-full">
        <p className="font-heading font-bold text-sm text-slate-800 mb-1 truncate">Learn to cook chicken</p>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="text-[10px] text-slate-400 font-medium">Active · 7 Days Remaining</p>
        </div>
        <div className="h-px bg-slate-200 mb-3" />
        <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "#E2E8F0" }}>
          <div className="h-full w-1/4 rounded-full" style={{ background: "linear-gradient(90deg, #5B4CF5, #818CF8)" }} />
        </div>

        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Week View</p>

        <div className="flex flex-col gap-2 flex-1">
          {lessons.map((l) => (
            <div
              key={l.title}
              className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{
                background: l.done ? "white" : "transparent",
                border: l.done ? "1px solid #F1F5F9" : "none",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: l.done ? "#5B4CF5" : "#E2E8F0" }}
              >
                {l.done && <span className="text-white text-[9px] font-bold">✓</span>}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-700 leading-tight">{l.title}</p>
                <p className="text-[9px] text-slate-400">{l.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(145deg, #EDEAFF 0%, #EEF0FF 45%, #F3F0FF 100%)" }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(91,76,245,0.30), transparent)" }}
      />
      {/* Soft orbs */}
      <div
        className="absolute top-24 right-1/3 w-[600px] h-[600px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: "rgba(91,76,245,0.09)" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(129,140,248,0.08)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">

        {/* ── Left — Copy ── */}
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-start">
          {/* Badge */}
          <motion.div variants={item}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-7 border"
              style={{ background: "rgba(91,76,245,0.08)", borderColor: "rgba(91,76,245,0.20)", color: "#5B4CF5" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#5B4CF5" }} />
              AI-Powered Learning
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={item}
            className="font-heading text-5xl sm:text-6xl lg:text-[62px] font-extrabold leading-[1.06] text-slate-900 mb-6 tracking-tight"
          >
            Tell Us What You<br />
            Want to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #5B4CF5, #818CF8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Master.
            </span>
            <br />
            We Build the Plan.
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={item} className="text-xl text-slate-500 max-w-md mb-8 leading-relaxed">
            A personalized roadmap for any skill — built for your level and timeline. Start learning in{" "}
            <strong className="text-slate-800">30 seconds.</strong>
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-wrap items-center gap-3 mb-10">
            <Link href="/signup">
              <motion.button
                whileHover={reduce ? {} : { scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 text-base font-bold text-white rounded-2xl cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #4338CA, #5B4CF5, #818CF8)",
                  boxShadow: "0 8px 24px rgba(91,76,245,0.35)",
                }}
              >
                Build My Roadmap
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <a href="#how-it-works">
              <button className="flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-700 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all shadow-sm">
                See How It Works
              </button>
            </a>
          </motion.div>

          {/* Trust row */}
          <motion.div variants={item} className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {avatars.map((src, i) => (
                  <img key={i} src={src} alt="User" width={32} height={32} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm font-bold text-slate-800 ml-1.5">4.9</span>
                </div>
                <p className="text-xs text-slate-500">Join 10,000+ active learners</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {["3-day free trial", "No credit card required"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Right — Phone mockups ── */}
        <div className="relative flex justify-center items-center h-[520px] lg:h-[600px]">
          {/* Radial glow behind phones */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 75% 70% at 55% 52%, rgba(91,76,245,0.11), transparent)" }}
          />

          {/* Left phone */}
          <motion.div
            className="absolute z-10"
            style={{ left: "0%", top: "50%", translateY: "-50%", rotate: -7 }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.75, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -13, 0] }}
              transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" as const, delay: 1.2 }}
            >
              <PhoneLeft />
            </motion.div>
          </motion.div>

          {/* Center phone — front, tallest */}
          <motion.div
            className="absolute z-20"
            style={{ left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, y: 50, scale: 0.90 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.80, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -16, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" as const, delay: 1.0 }}
            >
              <PhoneCenter />
            </motion.div>
          </motion.div>

          {/* Right phone */}
          <motion.div
            className="absolute z-10"
            style={{ right: "0%", top: "50%", translateY: "-46%", rotate: 7 }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.75, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -11, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" as const, delay: 1.6 }}
            >
              <PhoneRight />
            </motion.div>
          </motion.div>

          {/* Boss Battle badge — bottom right, floats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.1, type: "spring", stiffness: 200, damping: 16 }}
            className="absolute bottom-4 right-0 z-30"
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" as const, delay: 1.8 }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)", boxShadow: "0 8px 28px rgba(217,119,6,0.42)" }}
              >
                <Zap className="w-4 h-4 fill-white" />
                Boss Battle · 100 XP
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
