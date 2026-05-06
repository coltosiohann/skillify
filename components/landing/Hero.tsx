"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* Pulse dot */
function PulseDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{
        background: "var(--blue)",
        animation: "heroPulse 2s ease infinite",
      }}
    />
  );
}

/* Browser mockup — exact design replica */
function BrowserMockup() {
  return (
    <div
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid oklch(1 0 0 / 0.10)",
        boxShadow: "0 32px 80px oklch(0 0 0 / 0.55), 0 0 0 1px oklch(0 0 0 / 0.2), inset 0 1px 0 oklch(1 0 0 / 0.08)",
        transform: "rotateY(-5deg) rotateX(2deg)",
        transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "rotateY(-2deg) rotateX(1deg)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "rotateY(-5deg) rotateX(2deg)"; }}
    >
      {/* Browser bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", background: "oklch(0.10 0.016 255)", borderBottom: "1px solid oklch(1 0 0 / 0.07)" }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57", flexShrink: 0 }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFBD2E", flexShrink: 0 }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "oklch(0.145 0.018 255)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", fontWeight: 500, color: "oklch(0.50 0.01 255)", border: "1px solid oklch(1 0 0 / 0.06)" }}>
          app.skillify.io/dashboard
        </div>
      </div>
      {/* App content */}
      <div style={{ display: "flex", background: "oklch(0.09 0.013 255)", height: "360px" }}>
        {/* Mini sidebar */}
        <div style={{ width: "52px", background: "oklch(0.10 0.016 255)", borderRight: "1px solid oklch(1 0 0 / 0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "14px 0" }}>
          <div style={{ width: 30, height: 30, borderRadius: "8px", background: "var(--blue)", display: "grid", placeItems: "center", fontFamily: "var(--fd)", fontWeight: 800, fontSize: "13px", color: "#fff", marginBottom: "10px" }}>S</div>
          <div style={{ width: 32, height: 32, borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "14px", background: "var(--blue-muted)", color: "var(--blue)" }}>⌂</div>
          <div style={{ width: 32, height: 32, borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "14px", color: "oklch(0.45 0.01 255)" }}>⊞</div>
          <div style={{ width: 32, height: 32, borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "14px", color: "oklch(0.45 0.01 255)" }}>✦</div>
          <div style={{ width: 32, height: 32, borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "14px", color: "oklch(0.45 0.01 255)" }}>◎</div>
          <div style={{ width: 32, height: 32, borderRadius: "8px", display: "grid", placeItems: "center", fontSize: "14px", color: "oklch(0.45 0.01 255)" }}>★</div>
        </div>
        {/* Main area */}
        <div style={{ flex: 1, overflow: "hidden", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>Good morning, Alex 👋</div>
          <div style={{ fontSize: "10px", color: "oklch(0.50 0.01 255)", marginBottom: "10px" }}>You're on a 12-day streak — keep it up!</div>
          {/* Continue card */}
          <div style={{ background: "oklch(0.14 0.020 255)", borderRadius: "10px", padding: "12px", border: "1px solid oklch(1 0 0 / 0.06)", position: "relative", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,var(--blue-muted),transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "oklch(0.55 0.01 255)", marginBottom: "5px" }}>Continue Learning</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>React Fundamentals</div>
              <div style={{ fontSize: "10px", color: "oklch(0.55 0.12 256)", marginBottom: "8px" }}>Next: Hooks &amp; State Management</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "oklch(1 0 0 / 0.08)" }}>
                  <div style={{ height: "100%", borderRadius: "3px", background: "var(--blue)", width: "67%" }} />
                </div>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "oklch(0.65 0.15 256)" }}>67%</span>
              </div>
              <div style={{ position: "absolute", right: "0px", top: "-32px", background: "var(--blue)", color: "#fff", borderRadius: "6px", padding: "5px 10px", fontSize: "10px", fontWeight: 600 }}>Continue →</div>
            </div>
          </div>
          {/* XP row */}
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, background: "oklch(0.13 0.018 255)", borderRadius: "9px", padding: "10px 11px", border: "1px solid oklch(1 0 0 / 0.05)" }}>
              <div style={{ fontSize: "9px", color: "oklch(0.48 0.01 255)", marginBottom: "4px" }}>This Week</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "5px" }}>340 <span style={{ fontSize: "9px", color: "oklch(0.50 0.01 255)", fontWeight: 400 }}>/ 500 XP</span></div>
              <div style={{ height: "4px", borderRadius: "3px", background: "oklch(1 0 0 / 0.08)" }}>
                <div style={{ height: "100%", borderRadius: "3px", background: "var(--gold)", width: "68%" }} />
              </div>
            </div>
            <div style={{ flex: 1, background: "oklch(0.13 0.018 255)", borderRadius: "9px", padding: "10px 11px", border: "1px solid oklch(1 0 0 / 0.05)" }}>
              <div style={{ fontSize: "9px", color: "oklch(0.48 0.01 255)", marginBottom: "4px" }}>Streak</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: "13px", fontWeight: 700, color: "var(--gold)" }}>🔥 12</div>
              <div style={{ fontSize: "9px", color: "oklch(0.50 0.01 255)", marginTop: "3px" }}>days in a row</div>
            </div>
          </div>
          {/* Courses */}
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: ".4px", textTransform: "uppercase", color: "oklch(0.45 0.01 255)", marginBottom: "6px" }}>My Courses</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { tag: "JavaScript", name: "React Fundamentals", pct: "67%" },
              { tag: "Finance", name: "Options Trading", pct: "28%" },
            ].map((c, i) => (
              <div key={i} style={{ flex: 1, background: "oklch(0.13 0.018 255)", borderRadius: "9px", padding: "10px", border: "1px solid oklch(1 0 0 / 0.05)" }}>
                <div style={{ fontSize: "8px", fontWeight: 600, letterSpacing: ".3px", textTransform: "uppercase", color: "oklch(0.55 0.15 256)", marginBottom: "4px" }}>{c.tag}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#fff", marginBottom: "6px", lineHeight: 1.3 }}>{c.name}</div>
                <div style={{ height: "3px", borderRadius: "2px", background: "oklch(1 0 0 / 0.08)" }}>
                  <div style={{ height: "100%", borderRadius: "2px", background: "var(--blue)", width: c.pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        padding: "120px 32px 80px",
        background: "oklch(0.07 0.015 255)",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes heroPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes heroFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mockupIn { from{opacity:0;transform:translateY(30px) rotateY(-8deg)} to{opacity:1;transform:translateY(0) rotateY(-5deg)} }
        .hero-left-child { animation: heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .hero-eyebrow-anim { animation-delay: .05s; }
        .hero-title-anim   { animation-delay: .12s; }
        .hero-sub-anim     { animation-delay: .20s; }
        .hero-cta-anim     { animation-delay: .28s; }
        .hero-social-anim  { animation-delay: .35s; }
        .hero-mockup-anim  { animation: mockupIn 1s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
      `}</style>

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(oklch(1 0 0 / 0.045) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />
      {/* Blue glow */}
      <div style={{
        position: "absolute", width: "700px", height: "700px",
        top: "50%", left: "50%", transform: "translate(-20%, -50%)",
        background: "radial-gradient(ellipse, oklch(0.53 0.23 256 / 0.12) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: "1200px", margin: "0 auto", width: "100%",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "clamp(24px, 5vw, 64px)", alignItems: "center", position: "relative", zIndex: 1,
      }} className="hero-grid">
        {/* Left — copy */}
        <div>
          <div className="hero-left-child hero-eyebrow-anim" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "5px 12px", borderRadius: "999px",
            border: "1px solid var(--blue-border)", background: "var(--blue-muted)",
            fontSize: "12px", fontWeight: 600, letterSpacing: ".5px",
            color: "oklch(0.72 0.18 256)", textTransform: "uppercase",
            marginBottom: "24px",
          }}>
            <PulseDot />
            AI-Powered Learning Platform
          </div>

          <h1 className="hero-left-child hero-title-anim" style={{
            fontFamily: "var(--fd)",
            fontSize: "clamp(42px,5vw,64px)",
            fontWeight: 800, lineHeight: 1.08, letterSpacing: "-2px",
            color: "#fff", marginBottom: "22px",
          }}>
            Master any skill.<br />
            <em style={{ fontStyle: "normal", color: "var(--blue)" }}>Built for you</em><br />
            in 30 seconds.
          </h1>

          <p className="hero-left-child hero-sub-anim" style={{
            fontSize: "17px", color: "oklch(0.68 0.01 255)",
            lineHeight: 1.7, maxWidth: "460px", marginBottom: "36px",
          }}>
            Tell Skillify what you want to learn. The AI builds a complete, personalized course — adapted to your level, schedule, and goals. Not a library. Your curriculum.
          </p>

          <div className="hero-left-child hero-cta-anim" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}>
            <Link href="/signup">
              <button
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "13px 24px", borderRadius: "14px",
                  fontSize: "15px", fontWeight: 600,
                  background: "var(--blue)", color: "#fff",
                  border: "none", cursor: "pointer",
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
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "12px 24px", borderRadius: "14px",
                fontSize: "15px", fontWeight: 600,
                border: "1px solid oklch(1 0 0 / 0.15)",
                color: "oklch(0.82 0.01 255)",
                transition: "border-color 0.2s, background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "oklch(1 0 0 / 0.35)";
                el.style.background = "oklch(1 0 0 / 0.05)";
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "oklch(1 0 0 / 0.15)";
                el.style.background = "transparent";
                el.style.transform = "";
              }}
            >
              See how it works
            </a>
          </div>

          <div className="hero-left-child hero-social-anim" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex" }}>
              {["AJ", "MK", "SR", "TL", "+"].map((av, i) => (
                <span key={i} style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  border: "2px solid oklch(0.07 0.015 255)",
                  background: "oklch(0.155 0.020 255)",
                  display: "grid", placeItems: "center",
                  fontSize: "11px", fontWeight: 700,
                  marginLeft: i === 0 ? "0" : "-8px",
                  color: "oklch(0.70 0.012 255)",
                }}>
                  {av}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "13px", color: "oklch(0.60 0.01 255)" }}>
              <strong style={{ color: "oklch(0.82 0.01 255)" }}>10,000+ learners</strong> already building their skills
            </p>
          </div>
        </div>

        {/* Right — browser mockup */}
        <div
          className="hero-mockup-anim hidden md:block"
          style={{ perspective: "1200px" }}
        >
          <BrowserMockup />
        </div>
      </div>
    </section>
  );
}
