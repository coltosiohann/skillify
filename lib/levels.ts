import { Star, BookOpen, Target, Brain, GraduationCap, Trophy, Crown } from "lucide-react";

export const LEVELS = [
  { name: "Newcomer",  min: 0,     max: 499,   color: "from-gray-400 to-gray-500",      icon: Star },
  { name: "Learner",   min: 500,   max: 1499,  color: "from-emerald-400 to-emerald-600", icon: BookOpen },
  { name: "Explorer",  min: 1500,  max: 3499,  color: "from-blue-400 to-blue-600",       icon: Target },
  { name: "Scholar",   min: 3500,  max: 6999,  color: "from-violet-400 to-violet-600",   icon: Brain },
  { name: "Master",    min: 7000,  max: 14999, color: "from-amber-400 to-amber-500",     icon: GraduationCap },
  { name: "Champion",  min: 15000, max: 29999, color: "from-orange-400 to-red-500",      icon: Trophy },
  { name: "Legend",    min: 30000, max: Infinity, color: "from-rose-500 to-purple-600",  icon: Crown },
] as const;

export function getCurrentLevel(xp: number) {
  return [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0];
}

export function getNextLevel(xp: number) {
  return LEVELS.find((l) => xp < l.min) ?? null;
}

export function getLevelProgress(xp: number): { pct: number; xpInLevel: number; xpNeeded: number } {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return { pct: 100, xpInLevel: xp - current.min, xpNeeded: 0 };
  const xpInLevel = xp - current.min;
  const xpNeeded = next.min - current.min;
  return { pct: Math.round((xpInLevel / xpNeeded) * 100), xpInLevel, xpNeeded };
}
