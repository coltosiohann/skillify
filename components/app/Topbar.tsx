"use client";

import { Bell, Search, Menu, BookOpen, GraduationCap, X, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useSidebar } from "./SidebarContext";
import { AnimatePresence, motion } from "framer-motion";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
}

let profileCache: { data: Profile; expiresAt: number } | null = null;

interface SearchResult {
  courses: { id: string; title: string; domain: string; detected_level: string; status: string }[];
  lessons: { id: string; title: string; courseId: string; courseTitle: string }[];
}

export default function Topbar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const { setMobileOpen } = useSidebar();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function load() {
      if (profileCache && profileCache.expiresAt > Date.now()) {
        setProfile(profileCache.data);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, total_xp, current_streak")
        .eq("id", user.id)
        .single();
      if (data) {
        profileCache = { data, expiresAt: Date.now() + 30_000 };
        setProfile(data);
      }
    }
    load();
  }, [supabase]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileSearchOpen(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isDark = theme === "dark";
  const hasResults = results && (results.courses.length > 0 || results.lessons.length > 0);

  const SearchResultsContent = ({ isMobile }: { isMobile?: boolean }) => (
    <>
      {searching && (
        <div className="px-4 py-3 text-sm" style={{ color: "var(--tx3)" }}>Searching…</div>
      )}
      {!searching && !hasResults && (
        <div className="px-4 py-3 text-sm" style={{ color: "var(--tx3)" }}>No results for &ldquo;{query}&rdquo;</div>
      )}
      {!searching && hasResults && (
        <>
          {results!.courses.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--tx3)" }}>Courses</p>
              {results!.courses.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ color: "var(--tx)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--blue-muted)" }}>
                    <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--blue)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs" style={{ color: "var(--tx3)" }}>{c.domain} · {c.detected_level}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {results!.lessons.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--tx3)" }}>Lessons</p>
              {results!.lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/courses/${l.courseId}/lesson/${l.id}`}
                  onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  style={{ color: "var(--tx)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--emerald-muted)" }}>
                    <GraduationCap className="w-3.5 h-3.5" style={{ color: "var(--emerald)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--tx3)" }}>{l.courseTitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      {!isMobile && (
        <div className="border-t px-4 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--tx3)" }}>
          Press Enter or click a result to navigate
        </div>
      )}
    </>
  );

  const topbarBtnStyle = {
    width: "34px", height: "34px",
    borderRadius: "var(--radius-lg)",
    display: "grid", placeItems: "center",
    color: "var(--tx3)", cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    background: "transparent", border: "none",
    flexShrink: 0,
  } as React.CSSProperties;

  return (
    <>
      {/* Mobile full-screen search overlay */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex flex-col md:hidden"
            style={{ background: "var(--background)" }}
          >
            <div className="flex items-center gap-3 px-4 border-b" style={{ height: "56px", borderColor: "var(--border)" }}>
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--tx3)" }} />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Search courses & lessons..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--tx)" }}
              />
              <button
                onClick={() => { setMobileSearchOpen(false); setQuery(""); setResults(null); }}
                style={topbarBtnStyle}
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {query.length >= 2 && <SearchResultsContent isMobile />}
              {query.length < 2 && (
                <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--tx3)" }}>
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header
        className="flex items-center gap-3 px-6 flex-shrink-0 border-b"
        style={{ height: "56px", background: "var(--background)", borderColor: "var(--border)", position: "sticky", top: 0, zIndex: 50 }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden"
          style={topbarBtnStyle}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search — desktop */}
        <div ref={searchRef} className="relative hidden md:flex items-center gap-2 px-3"
          style={{
            height: "34px", borderRadius: "var(--radius-lg)",
            background: "var(--bg2)", border: "1px solid var(--border)",
            width: "200px", color: "var(--tx3)", fontSize: "13px", cursor: "text",
          }}
          onClick={() => setSearchOpen(true)}
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search courses…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--tx)", minWidth: 0 }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults(null); }} className="flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Results dropdown */}
          {searchOpen && query.length >= 2 && (
            <div
              className="absolute top-full mt-2 left-0 right-0 overflow-hidden z-50"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "0 12px 40px oklch(0 0 0 / 0.25)",
                minWidth: "260px",
              }}
            >
              <SearchResultsContent />
            </div>
          )}
        </div>

        {/* Mobile search icon */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="md:hidden ml-auto"
          style={topbarBtnStyle}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-2 md:ml-auto">
          {/* XP chip */}
          {profile && (
            <span className="chip-xp hidden sm:inline-flex">
              ⚡ {profile.total_xp.toLocaleString("en-US")} XP
            </span>
          )}

          {/* Streak chip */}
          {profile && profile.current_streak > 0 && (
            <span className="chip-streak hidden sm:inline-flex">
              🔥 {profile.current_streak}d
            </span>
          )}

          {/* Theme toggle */}
          {mounted && (
            <button
              style={topbarBtnStyle}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover)"; (e.currentTarget as HTMLElement).style.color = "var(--tx)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--tx3)"; }}
            >
              {isDark
                ? <Sun className="w-[15px] h-[15px]" />
                : <Moon className="w-[15px] h-[15px]" />
              }
            </button>
          )}

          {/* Notifications */}
          <Link href="/notifications" style={{ ...topbarBtnStyle, display: "grid" }} aria-label="Notifications">
            <Bell className="w-[15px] h-[15px]" />
          </Link>

          {/* New Course button */}
          <Link href="/onboarding">
            <button
              className="hidden sm:inline-flex items-center gap-1.5 text-white text-[13px] font-semibold px-3 py-1.5 transition-colors"
              style={{ background: "var(--blue)", borderRadius: "var(--radius-lg)", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--blue)"; }}
            >
              + New Course
            </button>
          </Link>
        </div>
      </header>
    </>
  );
}
