"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const stats = [
  { target: 10000, format: (n: number) => `${Math.round(n / 1000)}K`, suffix: "+", label: "Active Learners" },
  { target: 1000000, format: (n: number) => `${(n / 1000000).toFixed(1)}M`, suffix: "+", label: "Lessons Completed" },
  { target: 50000, format: (n: number) => `${Math.round(n / 1000)}K`, suffix: "+", label: "Courses Generated" },
  { target: 49, format: (n: number) => (n / 10).toFixed(1), suffix: "/5", label: "Average Rating" },
];

function Counter({ target, format, suffix }: { target: number; format: (n: number) => string; suffix: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {format(value)}
      <span style={{ color: "var(--blue)" }}>{suffix}</span>
    </span>
  );
}

export default function StatsBar() {
  return (
    <div
      style={{
        background: "oklch(0.065 0.012 255)",
        borderTop: "1px solid oklch(1 0 0 / 0.07)",
        borderBottom: "1px solid oklch(1 0 0 / 0.07)",
        padding: "28px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              textAlign: "center",
              position: "relative",
            }}
          >
            {i > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "32px",
                  width: "1px",
                  background: "oklch(1 0 0 / 0.08)",
                  display: "block",
                }}
              />
            )}
            <div
              style={{
                fontFamily: "var(--font-bricolage)",
                fontSize: "30px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-1px",
              }}
            >
              <Counter target={s.target} format={s.format} suffix={s.suffix} />
            </div>
            <div style={{ fontSize: "13px", color: "oklch(0.55 0.01 255)", marginTop: "3px" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
