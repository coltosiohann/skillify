"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "oklch(0.06 0.010 255)",
        borderTop: "1px solid oklch(1 0 0 / 0.07)",
        padding: "48px 32px 32px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          className="landing-footer-grid"
          style={{
            display: "grid",
            gap: "48px",
            marginBottom: "40px",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "10px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "var(--blue)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-bricolage)",
                  fontWeight: 800,
                  fontSize: "16px",
                  color: "#fff",
                }}
              >
                S
              </div>
              <span
                style={{
                  fontFamily: "var(--font-bricolage)",
                  fontWeight: 700,
                  fontSize: "17px",
                  letterSpacing: "-0.3px",
                  color: "oklch(0.80 0.01 255)",
                }}
              >
                Skillify
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "oklch(0.50 0.01 255)", marginTop: "10px", maxWidth: "260px", lineHeight: 1.7 }}>
              AI-powered personalized learning. Any skill, any level, built in seconds. The personal curriculum engine for the self-directed learner.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "oklch(0.50 0.01 255)", marginBottom: "14px" }}>
              Product
            </h4>
            {["How It Works", "Features", "Pricing", "Changelog"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ display: "block", fontSize: "14px", color: "oklch(0.55 0.01 255)", marginBottom: "9px", transition: "color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.80 0.01 255)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.55 0.01 255)"; }}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "oklch(0.50 0.01 255)", marginBottom: "14px" }}>
              Company
            </h4>
            {["About", "Blog", "Careers", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ display: "block", fontSize: "14px", color: "oklch(0.55 0.01 255)", marginBottom: "9px", transition: "color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.80 0.01 255)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.55 0.01 255)"; }}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "oklch(0.50 0.01 255)", marginBottom: "14px" }}>
              Legal
            </h4>
            <Link href="/privacy" style={{ display: "block", fontSize: "14px", color: "oklch(0.55 0.01 255)", marginBottom: "9px", transition: "color 0.2s" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ display: "block", fontSize: "14px", color: "oklch(0.55 0.01 255)", marginBottom: "9px", transition: "color 0.2s" }}>
              Terms of Service
            </Link>
            <a href="#" style={{ display: "block", fontSize: "14px", color: "oklch(0.55 0.01 255)", marginBottom: "9px", transition: "color 0.2s" }}>
              Cookie Policy
            </a>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid oklch(1 0 0 / 0.06)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", color: "oklch(0.40 0.01 255)" }}>
            © 2026 Skillify Inc. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/privacy" style={{ fontSize: "13px", color: "oklch(0.40 0.01 255)", transition: "color 0.2s" }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: "13px", color: "oklch(0.40 0.01 255)", transition: "color 0.2s" }}>Terms</Link>
            <a href="#" style={{ fontSize: "13px", color: "oklch(0.40 0.01 255)", transition: "color 0.2s" }}>Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
