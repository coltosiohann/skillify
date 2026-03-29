"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap, Flame, BookOpen, Trophy, Star, Camera, Save, Check,
  Clock, Target, Crown, GraduationCap, Brain, TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { getCurrentLevel, getNextLevel } from "@/lib/levels";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  total_xp: number;
  current_streak: number;
  courses_generated_this_month: number;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  status: string;
  domain: string;
  detected_level: string;
  created_at: string;
}

interface ProgressRow {
  lesson_id: string;
  completed_at: string;
}

interface Props {
  profile: Profile | null;
  email: string;
  courses: Course[];
  progress: ProgressRow[];
}


const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay },
});

const planBadge: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-gray-100 text-gray-600 border-gray-200" },
  pro: { label: "Pro", className: "bg-violet-100 text-violet-700 border-violet-200" },
  team: { label: "Team", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const levelColor: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-violet-100 text-violet-700",
};

export default function ProfileClient({ profile, email, courses, progress }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: cacheBusted } as never)
        .eq("id", user.id);
      if (updateErr) throw updateErr;

      setAvatarUrl(cacheBusted);
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const xp = profile?.total_xp ?? 0;
  const streak = profile?.current_streak ?? 0;
  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelPct = nextLevel
    ? Math.round(((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  const LevelIcon = currentLevel.icon;
  const joinDate = new Date(profile?.created_at ?? Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const plan = planBadge[profile?.plan ?? "free"] ?? planBadge.free;

  const initials = (profile?.full_name ?? email)
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "SK";

  const completedCourses = courses.filter((c) => c.status === "completed").length;
  const lessonsCompleted = progress.length;

  // Recent activity (last 5)
  const recentActivity = progress.slice(0, 5).map((p) => ({
    type: "lesson" as const,
    label: "Completed a lesson",
    date: new Date(p.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    icon: CheckIcon,
    color: "text-emerald-500 bg-emerald-50",
  }));

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", (await supabase.auth.getUser()).data.user!.id);
      if (error) throw error;
      setSaved(true);
      toast.success("Profile saved!");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your learning identity and stats</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar card */}
          <motion.div {...fadeUp(0.05)} className="glass-card rounded-3xl p-6 border border-primary/10 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-20 h-20 ring-2 ring-primary/25 mx-auto">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary text-white text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow cursor-pointer hover:bg-[#6d28d9] transition-colors disabled:opacity-60"
                aria-label="Change avatar"
              >
                {uploadingAvatar ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <h2 className="font-heading font-bold text-foreground text-lg">
              {profile?.full_name ?? "No name set"}
            </h2>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge className={`text-xs border capitalize ${plan.className}`}>{plan.label}</Badge>
              <span className="text-xs text-muted-foreground">· Joined {joinDate}</span>
            </div>

            {/* Level badge */}
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${currentLevel.color} text-white text-sm font-semibold shadow-md`}>
              <LevelIcon className="w-4 h-4" />
              {currentLevel.name}
            </div>

            {/* XP bar */}
            <div className="mt-4 text-left">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{xp.toLocaleString()} XP</span>
                {nextLevel && <span>→ {nextLevel.name} at {nextLevel.min.toLocaleString()}</span>}
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${currentLevel.color} transition-all duration-700`}
                  style={{ width: `${levelPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{levelPct}% to {nextLevel?.name ?? "max level"}</p>
            </div>
          </motion.div>

          {/* Edit name card */}
          <motion.div {...fadeUp(0.1)} className="glass-card rounded-3xl p-5 border border-primary/10 space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Edit Profile</h3>
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="rounded-xl border-primary/15 focus-visible:ring-primary/20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                value={email}
                disabled
                className="rounded-xl border-primary/15 bg-muted text-muted-foreground text-sm cursor-not-allowed"
              />
            </div>
            <Button
              onClick={saveProfile}
              disabled={saving}
              className={`w-full h-10 rounded-xl font-semibold gap-2 cursor-pointer text-sm transition-all ${
                saved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-[#6d28d9]"
              } text-white`}
            >
              {saving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" /> Saved!</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save Changes</>
              )}
            </Button>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <motion.div {...fadeUp(0.08)}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total XP", value: xp.toLocaleString(), icon: Zap, color: "bg-primary/10 text-primary" },
                { label: "Day Streak", value: `${streak}d`, icon: Flame, color: "bg-amber-100 text-amber-600" },
                { label: "Lessons Done", value: lessonsCompleted, icon: BookOpen, color: "bg-emerald-100 text-emerald-600" },
                { label: "Courses", value: completedCourses, icon: Trophy, color: "bg-violet-100 text-violet-600" },
              ].map((s, i) => (
                <motion.div key={s.label} {...fadeUp(0.1 + i * 0.06)}>
                  <div className="glass-card rounded-2xl border border-primary/8 p-4 text-center hover:shadow-md hover:shadow-primary/6 transition-all">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
                      <s.icon className="w-4.5 h-4.5" />
                    </div>
                    <p className="font-heading font-extrabold text-xl text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Courses */}
          <motion.div {...fadeUp(0.2)} className="glass-card rounded-3xl p-5 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">My Courses</h3>
              <Link href="/courses" className="text-xs text-primary hover:underline cursor-pointer">View all</Link>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
                <Link href="/onboarding">
                  <Button size="sm" className="mt-3 rounded-xl bg-primary text-white cursor-pointer">
                    Create your first course
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.slice(0, 4).map((c) => (
                  <Link key={c.id} href={`/courses/${c.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/4 border border-transparent hover:border-primary/10 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                        📚
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {c.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.domain}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${levelColor[c.detected_level] ?? "bg-gray-100"}`}>
                          {c.detected_level}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div {...fadeUp(0.25)} className="glass-card rounded-3xl p-5 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-foreground">Recent Activity</h3>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet — start learning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <a.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{a.label}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Small icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
