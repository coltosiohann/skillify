"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try Skillify with no commitment.",
    cta: "Get Started Free",
    ctaHref: "/signup",
    highlight: false,
    features: [
      "2 AI courses per month",
      "Basic quiz system",
      "Progress tracking",
      "Community access",
    ],
    missing: ["PDF uploads", "Unlimited courses", "Boss Battle challenges", "Completion certificates"],
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/ month",
    desc: "Everything you need to master any skill.",
    cta: "Start Free Trial",
    ctaHref: "/signup?plan=pro",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited AI courses",
      "PDF upload & extraction",
      "Full quiz system (all types)",
      "Boss Battle challenges",
      "XP badges + certificates",
      "Streak tracking",
      "Course export (PDF)",
      "Priority AI generation",
    ],
    missing: [],
  },
  {
    name: "Team",
    price: "$29.99",
    period: "/ month",
    desc: "For teams that learn and grow together.",
    cta: "Start Team Trial",
    ctaHref: "/signup?plan=team",
    highlight: false,
    features: [
      "Up to 5 team members",
      "Shared course library",
      "Team progress analytics",
      "Admin dashboard",
      "All Pro features included",
      "Priority support",
    ],
    missing: [],
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" ref={ref} className="relative py-28 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0F172A 0%, #1A1440 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(91,76,245,0.40), transparent)" }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(91,76,245,0.12)" }} />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border" style={{ background: "rgba(91,76,245,0.15)", borderColor: "rgba(91,76,245,0.30)", color: "#818CF8" }}>
            Pricing
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-5">
            Simple,{" "}
            <span style={{ background: "linear-gradient(135deg, #818CF8, #C4B5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Transparent
            </span>{" "}
            Pricing
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Start free. Upgrade when you&apos;re ready. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: "easeOut" as const }}
              className="relative flex flex-col rounded-2xl p-6"
              style={
                plan.highlight
                  ? {
                      background: "linear-gradient(145deg, #4338CA, #5B4CF5)",
                      boxShadow: "0 32px 80px rgba(91,76,245,0.40), 0 0 0 1px rgba(129,140,248,0.20)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }
              }
            >
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "white", boxShadow: "0 4px 14px rgba(217,119,6,0.40)" }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: plan.highlight ? "rgba(255,255,255,0.20)" : "rgba(91,76,245,0.20)" }}
                >
                  <Zap className={`w-5 h-5 ${plan.highlight ? "text-white" : "text-indigo-400"}`} />
                </div>
                <p className={`font-heading font-bold text-xl mb-1 ${plan.highlight ? "text-white" : "text-white"}`}>{plan.name}</p>
                <p className="text-sm mb-5" style={{ color: plan.highlight ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)" }}>{plan.desc}</p>
                <div className="flex items-end gap-1">
                  <span className={`font-heading font-extrabold text-4xl ${plan.highlight ? "text-white" : "text-white"}`}>{plan.price}</span>
                  <span className="text-sm pb-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)" }}>{plan.period}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div
                      className="w-4 h-4 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.highlight ? "rgba(255,255,255,0.20)" : "rgba(91,76,245,0.25)" }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: plan.highlight ? "white" : "#818CF8" }} />
                    </div>
                    <span className="text-sm" style={{ color: plan.highlight ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.65)" }}>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 opacity-30">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.40)" }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  style={
                    plan.highlight
                      ? {
                          background: "white",
                          color: "#4338CA",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                        }
                      : {
                          background: "rgba(91,76,245,0.25)",
                          color: "#C4B5FD",
                          border: "1px solid rgba(91,76,245,0.35)",
                        }
                  }
                >
                  {plan.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-sm mt-8"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          All plans include a 3-day free trial · No credit card required
        </motion.p>
      </div>
    </section>
  );
}
