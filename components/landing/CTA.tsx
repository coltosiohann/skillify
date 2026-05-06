"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

export default function CTA() {
  const ref = useRef(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      style={{
        background: "oklch(0.065 0.012 255)",
        padding: "96px 32px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(oklch(1 0 0 / 0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
        }}
      />
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 80% at 50% 100%, oklch(0.53 0.23 256 / 0.15), transparent)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bricolage)",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1.05,
            color: "#fff",
            marginBottom: "16px",
          }}
        >
          Your next skill is<br />30 seconds away.
        </h2>
        <p
          style={{
            fontSize: "18px",
            color: "oklch(0.62 0.01 255)",
            marginBottom: "36px",
            maxWidth: "480px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Join 10,000+ learners building real skills with AI-generated courses tailored just for them.
        </p>

        <Link href="/signup">
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 24px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--blue-hover)";
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 8px 32px var(--blue-border)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--blue)";
              el.style.transform = "";
              el.style.boxShadow = "";
            }}
          >
            Generate my first course →
          </button>
        </Link>

        <p style={{ fontSize: "13px", color: "oklch(0.42 0.01 255)", marginTop: "16px" }}>
          Free forever · No credit card · Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}
