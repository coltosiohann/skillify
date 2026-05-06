"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features",     href: "#features" },
  { label: "Pricing",      href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isDark = theme === "dark";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
      style={{
        height: "60px",
        padding: "0 32px",
        background: "oklch(0.085 0.012 255 / 0.88)",
        borderBottom: scrolled ? "1px solid oklch(0.215 0.018 255)" : "1px solid transparent",
        backdropFilter: "blur(16px) saturate(1.4)",
        boxShadow: scrolled ? "0 1px 32px oklch(0 0 0 / 0.12)" : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center text-white font-bold text-[16px]"
          style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "var(--blue)", fontFamily: "var(--fd)",
          }}
        >
          S
        </div>
        <span
          className="font-bold text-[17px] text-white"
          style={{ fontFamily: "var(--fd)", letterSpacing: "-0.3px" }}
        >
          Skillify
        </span>
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-7">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-sm font-medium transition-colors"
            style={{ color: "oklch(0.70 0.012 255)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "oklch(0.70 0.012 255)"; }}
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Right actions */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-8 h-8 grid place-items-center rounded-lg transition-colors"
            style={{ color: "oklch(0.48 0.010 255)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.155 0.020 255)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "oklch(0.48 0.010 255)"; }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <Link href="/login">
          <button
            className="px-4 py-[7px] rounded-lg text-sm font-medium transition-colors"
            style={{ color: "oklch(0.70 0.012 255)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "oklch(0.155 0.020 255)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "oklch(0.70 0.012 255)"; }}
          >
            Sign in
          </button>
        </Link>

        <Link href="/signup">
          <button
            className="px-[18px] py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: "var(--blue)", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px var(--blue-border)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue)"; (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            Start for free →
          </button>
        </Link>
      </div>

      {/* Mobile burger */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden w-8 h-8 grid place-items-center rounded-lg transition-colors"
        style={{ color: "oklch(0.70 0.012 255)", background: "transparent", border: "none", cursor: "pointer" }}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 border-t flex flex-col md:hidden"
          style={{
            background: "oklch(0.085 0.012 255)",
            borderColor: "oklch(0.215 0.018 255)",
            padding: "12px 20px 20px",
          }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-medium border-b"
              style={{ color: "oklch(0.70 0.012 255)", borderColor: "oklch(0.215 0.018 255 / 0.5)" }}
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-4">
            <Link href="/login" onClick={() => setOpen(false)}>
              <button className="w-full py-2.5 text-sm font-medium rounded-lg border text-white" style={{ borderColor: "oklch(0.215 0.018 255)", background: "transparent", cursor: "pointer" }}>
                Sign In
              </button>
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}>
              <button className="w-full py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "var(--blue)", border: "none", cursor: "pointer" }}>
                Start for free →
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
