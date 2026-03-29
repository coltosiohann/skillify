"use client";

import { useState, useRef } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, Palette, CreditCard, Camera, Save, Check,
  Zap, Shield, Crown, ChevronRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface NotifPrefs {
  dailyReminder: boolean;
  weeklyReport: boolean;
  newBadge: boolean;
  streakAlert: boolean;
  courseComplete: boolean;
  reminderTime: string;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  total_xp: number;
  current_streak: number;
  courses_generated_this_month: number;
  created_at: string;
  notification_preferences: NotifPrefs | null;
  weekly_xp_goal?: number;
}

interface Props {
  profile: Profile | null;
  email: string;
  userId: string;
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
] as const;

type Tab = typeof TABS[number]["id"];

// Toggle component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? "bg-primary" : "bg-gray-200"
      }`}
      style={{ width: 40, height: 22 }}
    >
      <span
        className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[19px]" : "translate-x-0.5"
        }`}
        style={{ width: 18, height: 18, left: 2, top: 2 }}
      />
    </button>
  );
}

export default function SettingsClient({ profile, email, userId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
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
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url } as never).eq("id", userId);
      setAvatarUrl(url);
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Notification toggles — seeded from DB
  const defaultNotifs = {
    dailyReminder: true,
    weeklyReport: true,
    newBadge: true,
    streakAlert: true,
    courseComplete: true,
  };
  const [notifs, setNotifs] = useState({
    ...(profile?.notification_preferences ?? defaultNotifs),
  });
  const [reminderTime, setReminderTime] = useState(
    profile?.notification_preferences?.reminderTime ?? "09:00"
  );
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [weeklyXpGoal, setWeeklyXpGoal] = useState(profile?.weekly_xp_goal ?? 200);

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", userId);
      if (error) throw error;
      setSaved(true);
      toast.success("Profile saved!");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const planConfig: Record<string, { label: string; color: string; limit: string; icon: typeof Zap }> = {
    free: { label: "Free", color: "bg-gray-100 text-gray-700", limit: "2 courses/month", icon: Zap },
    pro: { label: "Pro", color: "bg-violet-100 text-violet-700", limit: "Unlimited courses", icon: Crown },
    team: { label: "Team", color: "bg-amber-100 text-amber-700", limit: "5 members", icon: Shield },
  };
  const plan = planConfig[profile?.plan ?? "free"] ?? planConfig.free;
  const PlanIcon = plan.icon;

  const initials = (profile?.full_name ?? email)
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "SK";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <motion.nav
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="sm:w-48 flex sm:flex-col gap-1 flex-shrink-0"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </motion.nav>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex-1 min-w-0"
        >
          <AnimatePresence mode="wait">
            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-card rounded-3xl p-6 border border-primary/10 space-y-6"
              >
                <h2 className="font-heading font-bold text-foreground">Profile</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-primary text-white text-lg font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow cursor-pointer hover:bg-[#6d28d9] transition-colors disabled:opacity-60"
                      aria-label="Change avatar"
                    >
                      {uploadingAvatar ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera className="w-3 h-3" />}
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{profile?.full_name ?? "No name set"}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Joined {new Date(profile?.created_at ?? Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="rounded-xl border-primary/15 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">Email</Label>
                    <Input
                      value={email}
                      disabled
                      className="rounded-xl border-primary/15 bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Total XP", value: (profile?.total_xp ?? 0).toLocaleString() },
                    { label: "Day Streak", value: `${profile?.current_streak ?? 0}d` },
                    { label: "Courses this month", value: profile?.courses_generated_this_month ?? 0 },
                  ].map((s, i) => (
                    <div key={i} className="bg-primary/5 rounded-xl p-3 text-center">
                      <p className="font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className={`w-full h-11 rounded-xl font-semibold gap-2 cursor-pointer transition-all ${
                    saved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-[#6d28d9]"
                  } text-white shadow-md`}
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : saved ? (
                    <><Check className="w-4 h-4" /> Saved!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-card rounded-3xl p-6 border border-primary/10 space-y-6"
              >
                <h2 className="font-heading font-bold text-foreground">Notifications</h2>
                <div className="space-y-1">
                  {[
                    { key: "dailyReminder" as const, label: "Daily Learning Reminder", desc: "Get reminded to study every day" },
                    { key: "weeklyReport" as const, label: "Weekly Progress Report", desc: "See your week in review every Sunday" },
                    { key: "newBadge" as const, label: "New Badge Earned", desc: "Celebrate when you unlock achievements" },
                    { key: "streakAlert" as const, label: "Streak at Risk", desc: "Alert before your streak resets" },
                    { key: "courseComplete" as const, label: "Course Completion", desc: "Celebrate finishing a course" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-primary/6 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={notifs[item.key]}
                        onChange={(v) => setNotifs((prev) => ({ ...prev, [item.key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reminderTime" className="text-sm font-medium text-foreground">Reminder Time</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="rounded-xl border-primary/15 focus-visible:ring-primary/20 w-40"
                  />
                  <p className="text-xs text-muted-foreground">When to send your daily reminder</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weeklyGoal" className="text-sm font-medium text-foreground">Weekly XP Goal</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="weeklyGoal"
                      type="number"
                      min={50}
                      max={5000}
                      step={50}
                      value={weeklyXpGoal}
                      onChange={(e) => setWeeklyXpGoal(Math.max(50, parseInt(e.target.value) || 200))}
                      className="rounded-xl border-primary/15 focus-visible:ring-primary/20 w-32"
                    />
                    <span className="text-sm text-muted-foreground">XP per week</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shown as a ring on your dashboard. Suggested: 200 (casual), 500 (regular), 1000 (intense).</p>
                </div>

                <Button
                  onClick={async () => {
                    setSavingNotifs(true);
                    try {
                      const { error } = await supabase
                        .from("profiles")
                        .update({ notification_preferences: { ...notifs, reminderTime }, weekly_xp_goal: weeklyXpGoal } as never)
                        .eq("id", userId);
                      if (error) throw error;
                      toast.success("Preferences saved!");
                    } catch {
                      toast.error("Failed to save preferences");
                    } finally {
                      setSavingNotifs(false);
                    }
                  }}
                  disabled={savingNotifs}
                  className="w-full h-11 rounded-xl font-semibold gap-2 bg-primary hover:bg-[#6d28d9] text-white shadow-md cursor-pointer disabled:opacity-60"
                >
                  {savingNotifs ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4" /> Save Preferences</>
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass-card rounded-3xl p-6 border border-primary/10 space-y-6"
              >
                <h2 className="font-heading font-bold text-foreground">Appearance</h2>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <ThemeToggle variant="card" />
                  <p className="text-xs text-muted-foreground">
                    System automatically matches your device&apos;s light/dark preference.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Learning Preferences</p>
                  {[
                    { label: "Show XP animations", desc: "Animate XP gain on lesson complete" },
                    { label: "Compact lesson view", desc: "Reduce whitespace in lesson reader" },
                    { label: "Auto-expand modules", desc: "Expand all modules by default" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-primary/6 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Toggle checked={i === 0 || i === 2} onChange={() => {}} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── BILLING ── */}
            {activeTab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Current plan */}
                <div className="glass-card rounded-3xl p-6 border border-primary/10">
                  <h2 className="font-heading font-bold text-foreground mb-4">Current Plan</h2>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/15">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <PlanIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground capitalize">{profile?.plan ?? "free"} Plan</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.color}`}>
                          {plan.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{plan.limit}</p>
                    </div>
                  </div>

                  {(profile?.plan === "free") && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-100 border border-primary/20">
                      <p className="font-semibold text-foreground mb-1">Upgrade to Pro</p>
                      <p className="text-sm text-muted-foreground mb-3">Unlock unlimited courses, PDF uploads, full quiz system, and more.</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-extrabold text-primary font-heading">$9.99</span>
                          <span className="text-muted-foreground text-sm">/month</span>
                        </div>
                        <Button
                          onClick={() => toast("Stripe coming soon!", { description: "Payment integration is in the next phase." })}
                          className="gap-2 rounded-xl bg-primary hover:bg-[#6d28d9] text-white shadow-md shadow-primary/25 cursor-pointer"
                        >
                          Upgrade <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan comparison */}
                <div className="glass-card rounded-3xl p-6 border border-primary/10">
                  <h3 className="font-heading font-bold text-foreground mb-4">Plan Features</h3>
                  <div className="space-y-3">
                    {[
                      { feature: "AI Course Generation", free: "2/month", pro: "Unlimited", team: "Unlimited" },
                      { feature: "PDF Upload", free: "—", pro: "✓", team: "✓" },
                      { feature: "Full Quiz System", free: "Basic", pro: "Full", team: "Full" },
                      { feature: "Export Courses", free: "—", pro: "✓", team: "✓" },
                      { feature: "Team Members", free: "1", pro: "1", team: "5" },
                    ].map((row, i) => (
                      <div key={i} className={`grid grid-cols-4 gap-2 text-sm py-2.5 ${i < 4 ? "border-b border-primary/6" : ""}`}>
                        <span className="text-muted-foreground col-span-1">{row.feature}</span>
                        <span className={`text-center font-medium ${profile?.plan === "free" ? "text-primary" : "text-foreground"}`}>{row.free}</span>
                        <span className={`text-center font-medium ${profile?.plan === "pro" ? "text-primary" : "text-foreground"}`}>{row.pro}</span>
                        <span className={`text-center font-medium ${profile?.plan === "team" ? "text-primary" : "text-foreground"}`}>{row.team}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground pt-1">
                      <span />
                      <span className="text-center font-medium">Free</span>
                      <span className="text-center font-medium">Pro</span>
                      <span className="text-center font-medium">Team</span>
                    </div>
                  </div>
                </div>

                {/* Usage */}
                <div className="glass-card rounded-3xl p-6 border border-primary/10">
                  <h3 className="font-heading font-bold text-foreground mb-4">This Month's Usage</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Courses Generated</span>
                        <span className="font-medium text-foreground">
                          {profile?.courses_generated_this_month ?? 0}/{profile?.plan === "free" ? "2" : "∞"}
                        </span>
                      </div>
                      {profile?.plan === "free" && (
                        <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(((profile?.courses_generated_this_month ?? 0) / 2) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
