"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl transition-all duration-300 ${
        scrolled
          ? "glass-card shadow-lg shadow-primary/10"
          : "bg-white/60 backdrop-blur-md border border-white/50"
      } rounded-2xl`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Skillify</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-primary/5 cursor-pointer"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground cursor-pointer">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full bg-primary hover:bg-[#6d28d9] text-white shadow-md shadow-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/40 cursor-pointer">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
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
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="md:hidden border-t border-primary/10 px-5 pb-4"
          >
            <nav className="flex flex-col gap-1 pt-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-primary/10">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full cursor-pointer">Sign In</Button>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full rounded-full bg-primary text-white cursor-pointer">Get Started Free</Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
