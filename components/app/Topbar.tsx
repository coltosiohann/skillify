"use client";

import { Bell, Search } from "lucide-react";
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
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
}

export default function Topbar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, total_xp, current_streak")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    }
    load();
  }, [supabase]);

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

  return (
    <header className="h-16 border-b border-primary/8 bg-white flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          className="pl-9 rounded-xl bg-muted border-0 focus-visible:ring-primary/20 text-sm"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* XP + Streak */}
        {profile && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary">
              <span className="text-xs font-bold">⚡</span>
              <span className="text-xs font-bold">{profile.total_xp.toLocaleString()} XP</span>
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
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
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
  );
}
