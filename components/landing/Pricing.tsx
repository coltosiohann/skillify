"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for trying out Skillify.",
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
    period: "per month",
    desc: "For serious learners who want everything.",
    cta: "Start Pro Trial",
    ctaHref: "/signup?plan=pro",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited AI courses",
      "PDF upload + extraction",
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
    period: "per month",
    desc: "For teams learning together.",
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
    <section id="pricing" ref={ref} className="py-24 px-4 bg-muted/40">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Pricing
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground mb-4">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: "easeOut" as const }}
              className={`relative flex flex-col rounded-2xl p-6 ${
                plan.highlight
                  ? "bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.03]"
                  : "bg-white border border-border shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? "bg-white/20" : "bg-primary/10"}`}>
                  <Zap className={`w-5 h-5 ${plan.highlight ? "text-white" : "text-primary"}`} />
                </div>
                <p className={`font-heading font-bold text-xl mb-1 ${plan.highlight ? "text-white" : "text-foreground"}`}>{plan.name}</p>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>{plan.desc}</p>
                <div className="flex items-end gap-1">
                  <span className={`font-heading font-extrabold text-4xl ${plan.highlight ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? "text-white/60" : "text-muted-foreground"}`}>/{plan.period}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-white" : "text-primary"}`} />
                    <span className={`text-sm ${plan.highlight ? "text-white/90" : "text-foreground"}`}>{f}</span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 opacity-40">
                    <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center text-xs">✕</span>
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref}>
                <Button
                  className={`w-full rounded-full font-semibold cursor-pointer ${
                    plan.highlight
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-primary text-white hover:bg-[#4338CA]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          All plans include a 3-day free trial · No credit card required
        </motion.p>
      </div>
    </section>
  );
}
