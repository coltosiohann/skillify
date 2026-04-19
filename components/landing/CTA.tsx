"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Star } from "lucide-react";

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <section ref={ref} className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.65, ease: "easeOut" as const }}
        className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(145deg, #3730A3 0%, #4338CA 30%, #5B4CF5 65%, #6D5FFA 100%)",
          boxShadow: "0 40px 100px rgba(67,56,202,0.40), 0 0 0 1px rgba(129,140,248,0.15)",
        }}
      >
        {/* Top highlight line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px" style={{ background: "rgba(255,255,255,0.30)" }} />

        {/* Floating orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(129,140,248,0.25)" }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(67,56,202,0.35)" }} />

        {/* Floating XP badge */}
        <motion.div
          className="absolute top-6 right-6 sm:top-8 sm:right-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none"
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.20)", color: "white", backdropFilter: "blur(8px)" }}
          animate={reduce ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
        >
          <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
          +50 XP Earned
        </motion.div>

        {/* Star badge */}
        <motion.div
          className="absolute bottom-6 left-6 sm:bottom-8 sm:left-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold pointer-events-none"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(8px)" }}
          animate={reduce ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay: 1 }}
        >
          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
          4.9 / 5 Rating
        </motion.div>

        {/* Content */}
        <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-xs font-bold uppercase tracking-widest mb-5"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Start Today — It&apos;s Free
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="font-heading text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white mb-6 leading-[1.05]"
          >
            Build your first course
            <br />
            in <span style={{ color: "#FDE68A" }}>30 seconds.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-lg mb-10 max-w-lg mx-auto"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Join 10,000+ learners mastering new skills with AI-powered personalized roadmaps.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <motion.button
                whileHover={reduce ? {} : { scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold cursor-pointer transition-all"
                style={{
                  background: "white",
                  color: "#4338CA",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.20)",
                }}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
              No credit card · 3-day free trial
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
