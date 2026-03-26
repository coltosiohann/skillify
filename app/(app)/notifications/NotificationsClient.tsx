"use client";

import { motion } from "framer-motion";
import { CheckCircle, BookOpen, Zap, Bell, Flame, Trophy } from "lucide-react";
import Link from "next/link";

export interface ProgressWithLesson {
  lesson_id: string;
  completed_at: string;
  lessons: { title: string; xp_reward: number } | null;
}

interface Course {
  id: string;
  title: string;
  status: string;
  created_at: string;
  domain: string;
}

interface Props {
  progress: ProgressWithLesson[];
  courses: Course[];
}

interface ActivityItem {
  id: string;
  type: "lesson_complete" | "course_created" | "course_complete" | "xp_milestone";
  title: string;
  description: string;
  date: Date;
  icon: typeof CheckCircle;
  iconColor: string;
  iconBg: string;
  link?: string;
  xp?: number;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const groups: Record<string, ActivityItem[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const item of items) {
    const d = new Date(item.date);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else label = item.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function NotificationsClient({ progress, courses }: Props) {
  // Build activity feed from progress + courses
  const items: ActivityItem[] = [];

  // Lesson completions
  for (const p of progress) {
    items.push({
      id: `lesson-${p.lesson_id}`,
      type: "lesson_complete",
      title: `Completed: ${p.lessons?.title ?? "a lesson"}`,
      description: p.lessons?.xp_reward ? `+${p.lessons.xp_reward} XP earned` : "Lesson finished",
      date: new Date(p.completed_at),
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      xp: p.lessons?.xp_reward,
    });
  }

  // Course events
  for (const c of courses) {
    items.push({
      id: `course-${c.id}`,
      type: "course_created",
      title: `New course created`,
      description: c.title,
      date: new Date(c.created_at),
      icon: BookOpen,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
      link: `/courses/${c.id}`,
    });

    if (c.status === "completed") {
      items.push({
        id: `course-complete-${c.id}`,
        type: "course_complete",
        title: `Course completed!`,
        description: c.title,
        date: new Date(c.created_at), // approximate
        icon: Trophy,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-50",
        link: `/courses/${c.id}`,
      });
    }
  }

  // Sort by date desc
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  const groups = groupByDate(items);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your learning activity feed</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-12 border border-primary/10 text-center"
        >
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading font-bold text-foreground mb-2">No activity yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start a course and complete lessons to see your activity here.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#6d28d9] transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Create a course
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {groups.map((group, gi) => (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + gi * 0.07 }}
            >
              {/* Date label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-primary/8" />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + gi * 0.05 + i * 0.04 }}
                  >
                    {item.link ? (
                      <Link href={item.link}>
                        <NotifCard item={item} />
                      </Link>
                    ) : (
                      <NotifCard item={item} />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifCard({ item }: { item: ActivityItem }) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-2xl border border-transparent hover:border-primary/10 hover:bg-primary/2 transition-all ${item.link ? "cursor-pointer" : ""}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
        <item.icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
        {item.xp && (
          <div className="flex items-center gap-1 mt-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-semibold text-amber-600">+{item.xp} XP</span>
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">{timeAgo(item.date)}</span>
    </div>
  );
}
