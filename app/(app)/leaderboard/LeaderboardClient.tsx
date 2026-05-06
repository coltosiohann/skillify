"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

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

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getLevel(xp: number): string {
  if (xp >= 10000) return "Master";
  if (xp >= 5000) return "Expert";
  if (xp >= 2500) return "Scholar";
  if (xp >= 1000) return "Apprentice";
  return "Beginner";
}

export default function LeaderboardClient({ allTime, weekly, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>("weekly");

  const entries = tab === "weekly" ? weekly : allTime;
  const xpKey: keyof LeaderboardEntry = tab === "weekly" ? "weeklyXp" : "total_xp";

  const podium = entries.slice(0, 3);
  const rest   = entries.slice(3);

  const myRank    = entries.findIndex((e) => e.id === currentUserId) + 1;
  const myEntry   = entries.find((e) => e.id === currentUserId);
  const above     = myRank > 1 ? entries[myRank - 2] : null;
  const xpBehind  = above ? ((above[xpKey] as number) - ((myEntry?.[xpKey] as number) ?? 0)) : 0;

  const topStreaks = [...entries].sort((a, b) => b.current_streak - a.current_streak).slice(0, 5);

  const panel: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-xl)",
    padding: "18px",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-bricolage)", fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>
          Leaderboard
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>Top learners on Skillify</p>
      </div>

      {entries.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "var(--gold-muted)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: "24px" }}>🏆</div>
          <p style={{ fontWeight: 600, marginBottom: "6px" }}>You&apos;re first here!</p>
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
            {tab === "weekly" ? "No one has earned XP this week yet. Complete a lesson to claim the top spot!" : "No learners yet. You could be #1 — start a lesson now!"}
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <>
          {/* Podium */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px", marginBottom: "32px", padding: "24px 0 0" }}>
            {/* 2nd */}
            {podium[1] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px",
                  border: "3px solid var(--border)", marginBottom: "8px",
                  background: "var(--muted)", color: "var(--muted-foreground)",
                }}>
                  {initials(podium[1].full_name)}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px", textAlign: "center" }}>
                  {(podium[1].full_name ?? "Learner").split(" ")[0]}
                  {podium[1].id === currentUserId && <span style={{ fontSize: "10px", background: "var(--blue)", color: "#fff", padding: "1px 5px", borderRadius: "3px", marginLeft: "4px", fontWeight: 700 }}>You</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
                  {(podium[1][xpKey] as number).toLocaleString()} XP
                </div>
                <div style={{
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", width: "90px",
                  height: "72px", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(180deg, oklch(0.55 0.01 255), oklch(0.38 0.01 255))",
                }}>
                  <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "22px", fontWeight: 800, color: "rgba(255,255,255,.9)" }}>2</span>
                </div>
              </div>
            )}

            {/* 1st */}
            {podium[0] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px",
                    border: "3px solid var(--gold)", background: "var(--gold-muted)", color: "var(--gold)",
                  }}>
                    {initials(podium[0].full_name)}
                  </div>
                  <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "18px" }}>👑</span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px", textAlign: "center" }}>
                  {(podium[0].full_name ?? "Learner").split(" ")[0]}
                  {podium[0].id === currentUserId && <span style={{ fontSize: "10px", background: "var(--blue)", color: "#fff", padding: "1px 5px", borderRadius: "3px", marginLeft: "4px", fontWeight: 700 }}>You</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
                  {(podium[0][xpKey] as number).toLocaleString()} XP
                </div>
                <div style={{
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", width: "90px",
                  height: "100px", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(180deg, oklch(0.60 0.16 75), oklch(0.45 0.14 75))",
                }}>
                  <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "22px", fontWeight: 800, color: "rgba(255,255,255,.9)" }}>1</span>
                </div>
              </div>
            )}

            {/* 3rd */}
            {podium[2] && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  display: "grid", placeItems: "center", fontWeight: 800, fontSize: "16px",
                  border: "3px solid oklch(0.65 0.18 10 / 0.5)", marginBottom: "8px",
                  background: "var(--rose-muted, oklch(0.65 0.18 10 / 0.16))", color: "oklch(0.65 0.18 10)",
                }}>
                  {initials(podium[2].full_name)}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px", textAlign: "center" }}>
                  {(podium[2].full_name ?? "Learner").split(" ")[0]}
                  {podium[2].id === currentUserId && <span style={{ fontSize: "10px", background: "var(--blue)", color: "#fff", padding: "1px 5px", borderRadius: "3px", marginLeft: "4px", fontWeight: 700 }}>You</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
                  {(podium[2][xpKey] as number).toLocaleString()} XP
                </div>
                <div style={{
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", width: "90px",
                  height: "55px", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(180deg, oklch(0.55 0.12 50), oklch(0.40 0.10 50))",
                }}>
                  <span style={{ fontFamily: "var(--font-bricolage)", fontSize: "22px", fontWeight: 800, color: "rgba(255,255,255,.9)" }}>3</span>
                </div>
              </div>
            )}
          </div>

          {/* Main grid */}
          <div className="layout-leaderboard">

            {/* Left: filters + table */}
            <div>
              {/* Filter tabs */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                {([["weekly", "This Week"], ["alltime", "All Time"]] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    style={{
                      padding: "7px 16px", borderRadius: "99px", fontSize: "13px", fontWeight: 600,
                      background: tab === key ? "var(--blue-muted)" : "var(--card)",
                      border: `1px solid ${tab === key ? "var(--blue-border)" : "var(--border)"}`,
                      color: tab === key ? "oklch(0.72 0.18 256)" : "var(--muted-foreground)",
                      cursor: "pointer", transition: "0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                {entries.slice(0, 10).map((entry, i) => {
                  const rank  = i + 1;
                  const isMe  = entry.id === currentUserId;
                  const xp    = entry[xpKey] as number;
                  const rankColor = rank === 1 ? "var(--gold)" : rank === 2 ? "oklch(0.75 0.01 255)" : rank === 3 ? "oklch(0.65 0.10 50)" : "var(--muted-foreground)";

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 + i * 0.025 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        padding: "14px 20px",
                        borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none",
                        transition: "background 0.15s",
                        cursor: "default",
                        background: isMe ? "var(--blue-muted)" : "transparent",
                        borderLeft: isMe ? "2px solid var(--blue-border)" : "2px solid transparent",
                      }}
                      onMouseEnter={(e) => { if (!isMe) (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                      onMouseLeave={(e) => { if (!isMe) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      {/* Rank */}
                      <span style={{ width: "28px", textAlign: "center", fontFamily: "var(--font-bricolage)", fontSize: "14px", fontWeight: 800, color: rankColor, flexShrink: 0 }}>
                        {rank}
                      </span>

                      {/* Avatar */}
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: isMe ? "var(--blue-muted)" : "var(--muted)",
                        border: `2px solid ${isMe ? "var(--blue-border)" : "var(--border)"}`,
                        display: "grid", placeItems: "center",
                        fontWeight: 700, fontSize: "13px",
                        color: isMe ? "var(--blue)" : "var(--muted-foreground)",
                        flexShrink: 0,
                      }}>
                        {initials(entry.full_name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                          {entry.full_name ?? "Learner"}
                          {isMe && <span style={{ fontSize: "10px", fontWeight: 700, background: "var(--blue)", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>You</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                          {getLevel(entry.total_xp)}
                        </div>
                      </div>

                      {/* Streak */}
                      {entry.current_streak > 0 && (
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--gold)", flexShrink: 0 }}>
                          🔥 {entry.current_streak}
                        </span>
                      )}

                      {/* XP */}
                      <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "16px", fontWeight: 800, flexShrink: 0, minWidth: "80px", textAlign: "right" }}>
                        {xp.toLocaleString()} XP
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right panels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* My Rank */}
              <div style={{
                background: "linear-gradient(135deg, var(--blue-muted), transparent)",
                border: "1px solid var(--blue-border)",
                borderRadius: "var(--radius-xl)", padding: "20px",
                textAlign: "center",
              }}>
                <div style={{ fontFamily: "var(--font-bricolage)", fontSize: "48px", fontWeight: 800, letterSpacing: "-3px", color: "var(--blue)" }}>
                  {myRank > 0 ? `#${myRank}` : "—"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginBottom: "12px" }}>
                  Your rank {tab === "weekly" ? "this week" : "all time"}
                </div>
                {myRank > 0 && (
                  <>
                    <div style={{ height: "4px", borderRadius: "2px", background: "var(--muted)", margin: "10px 0 8px" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (entries.length - myRank) / Math.max(1, entries.length) * 100)}%`, background: "var(--blue)", borderRadius: "2px" }} />
                    </div>
                    {above && xpBehind > 0 && (
                      <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                        Only <strong style={{ color: "var(--emerald)" }}>{xpBehind.toLocaleString()} XP</strong> behind #{myRank - 1}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Top Streaks */}
              {topStreaks.length > 0 && (
                <div style={panel}>
                  <div style={{ fontFamily: "var(--font-bricolage)", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>
                    Top Streaks
                  </div>
                  {topStreaks.filter(e => e.current_streak > 0).map((e, i) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 0",
                        borderBottom: i < topStreaks.length - 1 ? "1px solid var(--border)" : "none",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ width: "20px", textAlign: "center", fontWeight: 700, fontSize: "12px", color: "var(--muted-foreground)" }}>{i + 1}</span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{e.full_name?.split(" ")[0] ?? "Learner"}</span>
                      <span style={{ fontWeight: 700, color: "var(--gold)" }}>🔥 {e.current_streak}d</span>
                    </div>
                  ))}
                  {topStreaks.filter(e => e.current_streak > 0).length === 0 && (
                    <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>No active streaks yet.</p>
                  )}
                </div>
              )}

              {/* Encouragement card */}
              <div style={{ ...panel, textAlign: "center" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                  <Trophy style={{ width: "28px", height: "28px", color: "var(--gold)", margin: "0 auto" }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>Keep climbing!</p>
                <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  Complete a lesson to earn XP and move up the leaderboard.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
