"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, CheckSquare, Star } from "lucide-react";

const stats = [
  { value: 10, suffix: "k+", label: "Active Learners", icon: Users, color: "#5B4CF5" },
  { value: 1, suffix: "M+", label: "Tasks Completed", icon: CheckSquare, color: "#059669" },
  { value: 4.9, suffix: "/5", label: "Average Rating", icon: Star, color: "#D97706", decimals: 1 },
];

function CountUp({ to, suffix, decimals = 0 }: { to: number; suffix: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    const end = to;
    const duration = 1800;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((end * eased).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, decimals]);

  const display = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();
  return <span ref={ref}>{display}{suffix}</span>;
}

export default function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #4338CA, #5B4CF5, #6366F1)",
          boxShadow: "0 20px 60px rgba(91,76,245,0.35)",
        }}
      >
        {/* Decorative highlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px" style={{ background: "rgba(255,255,255,0.20)" }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(129,140,248,0.20)" }} />

        <div className="relative grid grid-cols-3 gap-0">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: "easeOut" as const }}
              className={`flex flex-col items-center text-center py-8 px-4 ${i < stats.length - 1 ? "border-r border-white/15" : ""}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.15)" }}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-1">
                <CountUp to={s.value} suffix={s.suffix} decimals={s.decimals} />
              </p>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
