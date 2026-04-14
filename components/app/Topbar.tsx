"use client";

import { Bell, Search, Menu, BookOpen, GraduationCap, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useSidebar } from "./SidebarContext";
import { AnimatePresence, motion } from "framer-motion";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
}

// Module-level profile cache — shared across all Topbar renders
// TTL: 30 seconds to avoid re-fetching on every soft navigation
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

  useEffect(() => {
    async function load() {
      // Serve from cache if fresh
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

  // Debounced search
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

  // Close desktop search on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus mobile search input when opened; close on Escape
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

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "SK";

  const hasResults = results && (results.courses.length > 0 || results.lessons.length > 0);

  const SearchResultsContent = ({ isMobile }: { isMobile?: boolean }) => (
    <>
      {searching && (
        <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
      )}
      {!searching && !hasResults && (
        <div className="px-4 py-3 text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</div>
      )}
      {!searching && hasResults && (
        <>
          {results!.courses.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Courses</p>
              {results!.courses.map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.domain} · {c.detected_level}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {results!.lessons.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lessons</p>
              {results!.lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/courses/${l.courseId}/lesson/${l.id}`}
                  onClick={() => { setSearchOpen(false); setMobileSearchOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.courseTitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      {!isMobile && (
        <div className="border-t border-primary/8 px-4 py-2 text-xs text-muted-foreground">
          Press Enter or click a result to navigate
        </div>
      )}
    </>
  );

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
          className="fixed inset-0 z-50 bg-background flex flex-col md:hidden"
        >
          <div className="flex items-center gap-3 px-4 h-16 border-b border-primary/8">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Search courses & lessons..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => { setMobileSearchOpen(false); setQuery(""); setResults(null); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/5 cursor-pointer"
              aria-label="Close search"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {query.length >= 2 && <SearchResultsContent isMobile />}
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <header className="h-16 border-b border-primary/8 bg-card flex items-center px-4 md:px-6 gap-4 z-20 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
        <Input
          placeholder="Search courses & lessons..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          className="pl-9 pr-8 rounded-xl bg-muted border-0 focus-visible:ring-primary/20 text-sm"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Results dropdown */}
        {searchOpen && query.length >= 2 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-primary/10 rounded-2xl shadow-xl shadow-primary/10 overflow-hidden z-50">
            <SearchResultsContent />
          </div>
        )}
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setMobileSearchOpen(true)}
        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer flex-shrink-0 ml-auto"
        aria-label="Search"
      >
        <Search className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-3 md:ml-auto">
        {/* XP + Streak */}
        {profile && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary">
              <span className="text-xs font-bold">⚡</span>
              <span className="text-xs font-bold">{profile.total_xp.toLocaleString("en-US")} XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600">
              <span className="text-xs">🔥</span>
              <span className="text-xs font-bold">{profile.current_streak} day streak</span>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <ThemeToggle variant="icon" />

        {/* Notifications */}
        <Link href="/notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer" aria-label="Notifications">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Avatar menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer outline-none" aria-label="Account menu">
            <Avatar className="w-9 h-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? "User"} />
              <AvatarFallback className="bg-primary text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-primary/10 shadow-lg shadow-primary/10">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {profile?.full_name ?? "My Account"}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/profile"}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/settings"}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/achievements"}>
              Achievements
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
