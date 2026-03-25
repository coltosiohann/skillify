"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-violet-800 p-12 text-center shadow-2xl shadow-primary/30"
      >
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">
            Start Today
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Build your first course
            <br />
            in <span className="text-[#fde68a]">~30 seconds.</span>
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
            Join 10,000+ learners who are mastering new skills with AI-powered personalized roadmaps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button
                size="lg"
                className="rounded-full bg-white text-primary font-semibold hover:bg-white/90 shadow-lg shadow-black/20 active:scale-95 transition-all duration-200 gap-2 cursor-pointer"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-white/60 text-sm">No credit card · 3-day trial</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
