"use client";

import { motion } from "framer-motion";
import { Zap, Flame, BookOpen, Trophy, Lock, CheckCircle, Award, Rocket, Star, Target, GraduationCap, Brain, Crown } from "lucide-react";
import { LEVELS, getCurrentLevel, getNextLevel } from "@/lib/levels";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  plan: string;
  created_at: string;
}
interface Course { id: string; status: string }
interface ProgressRow { lesson_id: string; completed_at: string }
interface Props {
  profile: Profile | null;
  courses: Course[];
  progress: ProgressRow[];
}

export default function AchievementsClient({ profile, courses, progress }: Props) {
  const xp = profile?.total_xp ?? 0;
  const streak = profile?.current_streak ?? 0;
  const lessonsCompleted = progress.length;
  const coursesCompleted = courses.filter((c) => c.status === "completed").length;
  const totalCourses = courses.length;

  const currentLevel = getCurrentLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelPct = nextLevel
    ? Math.round(((xp - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;

  // Badge definitions
  const badges = [
    {
      id: "first_lesson",
      icon: BookOpen,
      label: "First Steps",
      desc: "Complete your first lesson",
      color: "from-emerald-400 to-emerald-600",
      earned: lessonsCompleted >= 1,
    },
    {
      id: "first_course",
      icon: Trophy,
      label: "Course Creator",
      desc: "Create your first course",
      color: "from-blue-400 to-blue-600",
      earned: totalCourses >= 1,
    },
    {
      id: "streak_3",
      icon: Flame,
      label: "On Fire",
      desc: "Maintain a 3-day streak",
      color: "from-orange-400 to-red-500",
      earned: streak >= 3,
    },
    {
      id: "lessons_10",
      icon: Star,
      label: "Dedicated",
      desc: "Complete 10 lessons",
      color: "from-amber-400 to-amber-500",
      earned: lessonsCompleted >= 10,
    },
    {
      id: "xp_500",
      icon: Zap,
      label: "Power Up",
      desc: "Earn 500 XP",
      color: "from-violet-400 to-violet-600",
      earned: xp >= 500,
    },
    {
      id: "streak_7",
      icon: Target,
      label: "Week Warrior",
      desc: "Maintain a 7-day streak",
      color: "from-rose-400 to-pink-600",
      earned: streak >= 7,
    },
    {
      id: "courses_3",
      icon: Rocket,
      label: "Course Collector",
      desc: "Create 3 courses",
      color: "from-sky-400 to-blue-600",
      earned: totalCourses >= 3,
    },
    {
      id: "course_complete",
      icon: GraduationCap,
      label: "Graduate",
      desc: "Complete a full course",
      color: "from-teal-400 to-emerald-600",
      earned: coursesCompleted >= 1,
    },
    {
      id: "lessons_50",
      icon: Brain,
      label: "Knowledge Seeker",
      desc: "Complete 50 lessons",
      color: "from-purple-400 to-violet-600",
      earned: lessonsCompleted >= 50,
    },
    {
      id: "xp_5000",
      icon: Crown,
      label: "XP Legend",
      desc: "Earn 5,000 XP",
      color: "from-yellow-400 to-orange-500",
      earned: xp >= 5000,
    },
    {
      id: "streak_30",
      icon: Award,
      label: "Monthly Master",
      desc: "Maintain a 30-day streak",
      color: "from-indigo-400 to-purple-600",
      earned: streak >= 30,
    },
    {
      id: "courses_10",
      icon: Trophy,
      label: "Unstoppable",
      desc: "Create 10 courses",
      color: "from-rose-500 to-purple-600",
      earned: totalCourses >= 10,
    },
  ];

  const earnedCount = badges.filter((b) => b.earned).length;
  const CurrentLevelIcon = currentLevel.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Achievements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{earnedCount}/{badges.length} badges earned</p>
      </motion.div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-3xl p-7 mb-6 bg-gradient-to-br ${currentLevel.color} text-white shadow-xl`}
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <CurrentLevelIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm mb-0.5">Current Level</p>
            <h2 className="font-heading text-2xl font-extrabold mb-3">{currentLevel.name}</h2>
            {nextLevel ? (
              <>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-white/70">{xp.toLocaleString()} XP</span>
                  <span className="font-bold">{levelPct}% → {nextLevel.name}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${levelPct}%` }}
                  />
                </div>
                <p className="text-white/60 text-xs mt-1.5">
                  {(nextLevel.min - xp).toLocaleString()} XP to {nextLevel.name}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Max level reached! 🎉</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        {[
          { label: "Total XP", value: xp.toLocaleString(), icon: Zap, color: "text-primary bg-primary/10" },
          { label: "Day Streak", value: streak, icon: Flame, color: "text-amber-600 bg-amber-50" },
          { label: "Lessons Done", value: lessonsCompleted, icon: BookOpen, color: "text-emerald-600 bg-emerald-50" },
          { label: "Courses Done", value: coursesCompleted, icon: Trophy, color: "text-violet-600 bg-violet-50" },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-4 border border-primary/10">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="font-heading text-xl font-extrabold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Level roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card rounded-3xl p-6 mb-8 border border-primary/10"
      >
        <h3 className="font-heading font-bold text-foreground mb-5">Level Roadmap</h3>
        <div className="space-y-3">
          {LEVELS.map((level, i) => {
            const LevelIcon = level.icon;
            const isReached = xp >= level.min;
            const isCurrent = currentLevel.name === level.name;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? "bg-primary/8 border border-primary/20" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${isReached ? level.color : "from-gray-200 to-gray-300"}`}>
                  <LevelIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isReached ? "text-foreground" : "text-muted-foreground"}`}>
                    {level.name}
                    {isCurrent && <span className="ml-2 text-xs text-primary font-medium">← You are here</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {level.max === Infinity ? `${level.min.toLocaleString()}+ XP` : `${level.min.toLocaleString()} – ${level.max.toLocaleString()} XP`}
                  </p>
                </div>
                {isReached && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="font-heading font-bold text-foreground mb-4">Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {badges.map((badge, i) => {
            const BadgeIcon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.03 }}
                className={`glass-card rounded-2xl p-4 text-center border transition-all ${
                  badge.earned
                    ? "border-primary/20 hover:border-primary/40 hover:shadow-md hover:shadow-primary/8"
                    : "border-primary/5 opacity-50"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-br ${badge.earned ? badge.color : "from-gray-200 to-gray-300"}`}>
                  {badge.earned ? (
                    <BadgeIcon className="w-6 h-6 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className={`text-sm font-semibold mb-1 ${badge.earned ? "text-foreground" : "text-muted-foreground"}`}>
                  {badge.label}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">{badge.desc}</p>
                {badge.earned && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle className="w-3 h-3" /> Earned
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
