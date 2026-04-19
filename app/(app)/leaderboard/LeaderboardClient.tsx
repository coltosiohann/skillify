"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Flame, Crown, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  weeklyXp: number;
}

interface Props {
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  currentUserId: string;
}

type Tab = "weekly" | "alltime";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function LeaderboardClient({ allTime, weekly, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("weekly");

  const entries = tab === "weekly" ? weekly : allTime;
  const xpKey = tab === "weekly" ? "weeklyXp" : "total_xp";

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Top learners on Skillify</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-6">
        {(["weekly", "alltime"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "weekly" ? "This Week" : "All Time"}
          </button>
        ))}
      </div>

      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <p className="font-semibold text-foreground mb-1">You&apos;re first here!</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {tab === "weekly"
              ? "No one has earned XP this week yet. Complete a lesson to claim the top spot!"
              : "No learners yet. You could be #1 — start a lesson now!"}
          </p>
        </motion.div>
      )}

      {/* Lonely podium message — only 1 user (the current user) */}
      {entries.length === 1 && entries[0].id === currentUserId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-4 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40"
        >
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            🥇 You&apos;re the first! Invite friends to compete.
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">
            Share Skillify and see who can earn the most XP this week.
          </p>
        </motion.div>
      )}

      {/* Podium — top 3 */}
      {podium.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-end justify-center gap-3 mb-6"
        >
          {/* 2nd place */}
          {podium[1] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar className="w-14 h-14 ring-2 ring-gray-300">
                <AvatarImage src={podium[1].avatar_url ?? undefined} />
                <AvatarFallback className="bg-gray-200 text-gray-700 font-bold">{initials(podium[1].full_name)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground truncate max-w-[80px]">{podium[1].full_name ?? "Learner"}</p>
                <p className="text-xs text-muted-foreground">{(podium[1][xpKey] as number).toLocaleString()} XP</p>
              </div>
              <div className="w-full h-16 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl flex items-center justify-center">
                <span className="text-2xl font-extrabold text-gray-400">2</span>
              </div>
            </div>
          )}
          {/* 1st place */}
          {podium[0] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="relative">
                <Avatar className="w-18 h-18 ring-2 ring-amber-400" style={{ width: 72, height: 72 }}>
                  <AvatarImage src={podium[0].avatar_url ?? undefined} />
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-lg">{initials(podium[0].full_name)}</AvatarFallback>
                </Avatar>
                <Crown className="w-5 h-5 text-amber-500 absolute -top-2 left-1/2 -translate-x-1/2" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground truncate max-w-[90px]">{podium[0].full_name ?? "Learner"}</p>
                <p className="text-xs text-amber-600 font-semibold">{(podium[0][xpKey] as number).toLocaleString()} XP</p>
              </div>
              <div className="w-full h-24 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-xl flex items-center justify-center">
                <span className="text-3xl font-extrabold text-amber-500">1</span>
              </div>
            </div>
          )}
          {/* 3rd place */}
          {podium[2] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar className="w-14 h-14 ring-2 ring-amber-700/40">
                <AvatarImage src={podium[2].avatar_url ?? undefined} />
                <AvatarFallback className="bg-amber-50 text-amber-800 font-bold">{initials(podium[2].full_name)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground truncate max-w-[80px]">{podium[2].full_name ?? "Learner"}</p>
                <p className="text-xs text-muted-foreground">{(podium[2][xpKey] as number).toLocaleString()} XP</p>
              </div>
              <div className="w-full h-10 bg-gradient-to-t from-amber-100 to-amber-50 rounded-t-xl flex items-center justify-center">
                <span className="text-xl font-extrabold text-amber-700">3</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="glass-card rounded-2xl border border-primary/10 overflow-hidden">
          {rest.map((entry, i) => {
            const rank = i + 4;
            const isMe = entry.id === currentUserId;
            const xp = (entry[xpKey] as number);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className={`flex items-center gap-3 px-5 py-3.5 border-b border-primary/5 last:border-0 transition-colors ${
                  isMe ? "bg-primary/5 border-primary/10" : "hover:bg-primary/2"
                }`}
              >
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <RankBadge rank={rank} />
                </div>
                <Avatar className={`w-9 h-9 flex-shrink-0 ${isMe ? "ring-2 ring-primary/40" : ""}`}>
                  <AvatarImage src={entry.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials(entry.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                    {entry.full_name ?? "Learner"}{isMe && " (you)"}
                  </p>
                  {entry.current_streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-500" />
                      <span className="text-xs text-muted-foreground">{entry.current_streak}d streak</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-amber-600 flex-shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{xp.toLocaleString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
