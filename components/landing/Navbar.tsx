"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, ArrowRight } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl transition-all duration-300 rounded-2xl ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl shadow-black/8"
          : "bg-white/70 backdrop-blur-md border border-white/80"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)", boxShadow: "0 4px 12px rgba(91,76,245,0.35)" }}
          >
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-heading font-bold text-lg text-slate-900">Skillify</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login">
            <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer rounded-lg hover:bg-slate-100">
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-xl cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)", boxShadow: "0 4px 12px rgba(91,76,245,0.30)" }}
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-slate-100 px-5 pb-5"
          >
            <nav className="flex flex-col gap-1 pt-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-100">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <button className="w-full py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">Sign In</button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <button
                    className="w-full py-2.5 text-sm font-bold text-white rounded-xl cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #5B4CF5, #818CF8)" }}
                  >
                    Get Started Free
                  </button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
