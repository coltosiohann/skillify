"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Zap, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type {
  CourseOutline,
  LessonPayload,
  PhaseEventData,
  OutlineEventData,
  LessonEventData,
  LessonErrorEventData,
  ErrorEventData,
} from "@/lib/types/generation-events";

// ─── State types ──────────────────────────────────────────────────────────────

type GenPhase = "connecting" | "outline" | "lessons" | "saving" | "done" | "error";

interface FailedLesson {
  moduleIndex: number;
  lessonIndex: number;
  title: string;
}

// ─── SSE parser ───────────────────────────────────────────────────────────────

function parseSSEChunk(chunk: string): { event: string; data: unknown }[] {
  const events: { event: string; data: unknown }[] = [];
  // SSE messages are separated by double newlines
  const messages = chunk.split(/\n\n/);
  for (const msg of messages) {
    if (!msg.trim()) continue;
    const lines = msg.split("\n");
    let event = "message";
    let dataStr = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) event = line.slice(7).trim();
      else if (line.startsWith("data: ")) dataStr = line.slice(6).trim();
    }
    if (dataStr) {
      try {
        events.push({ event, data: JSON.parse(dataStr) });
      } catch {
        // malformed chunk — skip
      }
    }
  }
  return events;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeneratingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase] = useState<GenPhase>("connecting");
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("Connecting...");
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [failedLessons, setFailedLessons] = useState<FailedLesson[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // lesson content keyed by "moduleIndex-lessonIndex"
  const lessonResults = useRef(new Map<string, LessonPayload>());
  const outlineRef = useRef<CourseOutline | null>(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Warn before leaving while generation is in progress ──────────────────
  useEffect(() => {
    const isActive = phase !== "done" && phase !== "error";
    if (!isActive) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers show their own generic message — we can't customise it
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  // ── Progress bar calculation ──────────────────────────────────────────────

  useEffect(() => {
    if (phase === "outline") setProgress(5);
  }, [phase]);

  useEffect(() => {
    if (phase === "lessons" && totalLessons > 0) {
      const pct = 10 + Math.round((completedLessons / totalLessons) * 85);
      setProgress(Math.min(95, pct));
    }
  }, [completedLessons, totalLessons, phase]);

  // ── Main generation function ──────────────────────────────────────────────

  async function generate() {
    const raw = localStorage.getItem("skillify_wizard");
    if (!raw) {
      setErrorMsg("Wizard data not found. Please start over.");
      setPhase("error");
      return;
    }

    const wizard = JSON.parse(raw);

    try {
      const res = await fetch("/api/ai/generate-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: wizard.domain,
          level: wizard.detectedLevel,
          durationWeeks: wizard.durationWeeks,
          minutesPerDay: wizard.minutesPerDay,
          learningStyle: wizard.learningStyle,
          pdfContext: wizard.extractedText ?? undefined,
          goalType:    wizard.goalType    ?? "auto",
          // Derive timeframe from durationWeeks so the AI always has it,
          // even if the user didn't explicitly pick one in Step 3
          timeframe:   wizard.timeframe   ?? `${wizard.durationWeeks} weeks`,
          useCases:    wizard.useCases    ?? undefined,
          constraints: wizard.constraints ?? undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Generation failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages end with \n\n — process complete messages only
        const boundary = buffer.lastIndexOf("\n\n");
        if (boundary === -1) continue;
        const toProcess = buffer.slice(0, boundary + 2);
        buffer = buffer.slice(boundary + 2);

        const events = parseSSEChunk(toProcess);

        for (const { event, data } of events) {
          switch (event) {
            case "phase": {
              const d = data as PhaseEventData;
              setPhase(d.phase === "outline" ? "outline" : d.phase === "lessons" ? "lessons" : "saving");
              setStatusLabel(d.message);
              if (d.total) setTotalLessons(d.total);
              break;
            }

            case "outline": {
              const d = data as OutlineEventData;
              outlineRef.current = d.outline;
              setOutline(d.outline);
              break;
            }

            case "lesson": {
              const d = data as LessonEventData;
              lessonResults.current.set(`${d.moduleIndex}-${d.lessonIndex}`, d.lesson);
              setCompletedLessons(d.current);

              // Build label: "Module 2 — Lesson 3: Title"
              const mod = outlineRef.current?.modules[d.moduleIndex];
              const lessonStub = mod?.lessons[d.lessonIndex];
              if (mod && lessonStub) {
                setStatusLabel(
                  `Module ${d.moduleIndex + 1} — Lesson ${d.lessonIndex + 1}: ${lessonStub.title}`
                );
              }
              break;
            }

            case "lesson-error": {
              const d = data as LessonErrorEventData;
              setFailedLessons((prev) => [
                ...prev,
                { moduleIndex: d.moduleIndex, lessonIndex: d.lessonIndex, title: d.title },
              ]);
              setCompletedLessons((n) => n + 1);
              break;
            }

            case "error": {
              const d = data as ErrorEventData;
              if (d.fatal) {
                throw new Error(d.message);
              }
              break;
            }

            case "done":
              break;
          }
        }
      }

      // ── Save to Supabase ──────────────────────────────────────────────────

      setPhase("saving");
      setProgress(96);
      setStatusLabel("Saving your course...");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentOutline = outlineRef.current;
      if (!currentOutline) throw new Error("No course outline received");

      // Insert course
      const { data: courseRow, error: courseErr } = await supabase
        .from("courses")
        .insert({
          user_id: user.id,
          title: currentOutline.title,
          domain: wizard.domain,
          detected_level: wizard.detectedLevel,
          duration_weeks: wizard.durationWeeks,
          learning_style: wizard.learningStyle,
          minutes_per_day: wizard.minutesPerDay,
          status: "active",
        })
        .select("id")
        .single();

      if (courseErr) throw courseErr;
      const cId = courseRow.id;

      // Insert modules + lessons (batch inserts per module to avoid N+1)
      for (let mIdx = 0; mIdx < currentOutline.modules.length; mIdx++) {
        const mod = currentOutline.modules[mIdx];

        const { data: modRow, error: modErr } = await supabase
          .from("modules")
          .insert({
            course_id: cId,
            title: mod.title,
            description: mod.description ?? "",
            order_index: mod.order_index ?? mIdx,
            duration_days: mod.duration_days ?? 7,
          })
          .select("id")
          .single();

        if (modErr) throw modErr;

        // Build all lesson rows for this module, then insert in a single call
        const lessonRows = mod.lessons.map((stub, lIdx) => {
          const content = lessonResults.current.get(`${mIdx}-${lIdx}`);
          return {
            module_id: modRow.id,
            title: stub.title,
            content_markdown: content?.content_markdown ?? `# ${stub.title}\n\nThis lesson content is being prepared.`,
            content_json: (content?.content_json ?? null) as unknown as import("@/lib/supabase/types").Json,
            resources_json: (content?.resources_json ?? []) as unknown as import("@/lib/supabase/types").Json,
            order_index: stub.order_index ?? lIdx,
            xp_reward: stub.xp_reward ?? 50,
            estimated_minutes: stub.estimated_minutes ?? 8,
            difficulty: stub.difficulty ?? "standard",
          };
        });

        if (lessonRows.length > 0) {
          const { error: lessonsErr } = await supabase.from("lessons").insert(lessonRows as never);
          if (lessonsErr) throw lessonsErr;
        }
      }

      // Link uploaded document if present
      if (wizard.documentId) {
        await supabase
          .from("documents")
          .update({ course_id: cId })
          .eq("id", wizard.documentId);
      }

      localStorage.removeItem("skillify_wizard");
      setProgress(100);
      setPhase("done");

      setTimeout(() => router.push(`/courses/${cId}`), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(msg);
      setPhase("error");
      toast.error(msg);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #4c1d95, #4338CA 30%, #7c3aed 60%, #1e1b4b)",
      }}
    >
      {/* Background sparkles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg relative z-10">
        <AnimatePresence mode="wait">

          {/* Generating / Saving */}
          {(phase === "connecting" || phase === "outline" || phase === "lessons" || phase === "saving") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="text-center"
            >
              {/* Animated icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-8 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
              >
                <Zap className="w-10 h-10 text-amber-400" />
              </motion.div>

              <h1 className="font-heading text-3xl font-extrabold text-white mb-2">
                {phase === "saving" ? "Saving your course..." : "Building your course..."}
              </h1>

              {/* Dynamic status label */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusLabel}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-white/60 mb-8 text-sm min-h-[1.5rem] line-clamp-2"
                >
                  {statusLabel}
                </motion.p>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full mb-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-400 to-amber-400 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Lesson counter */}
              {phase === "lessons" && totalLessons > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/40 text-xs mb-6"
                >
                  {completedLessons} of {totalLessons} lessons generated
                </motion.p>
              )}

              {/* Outline preview — show module titles once we have the outline */}
              {outline && phase === "lessons" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mt-2"
                >
                  <p className="text-xs text-white/40 uppercase tracking-wide mb-3 font-medium">
                    Course structure
                  </p>
                  <div className="space-y-1">
                    {outline.modules.map((mod, i) => {
                      const moduleDone =
                        mod.lessons.every((_, lIdx) =>
                          lessonResults.current.has(`${i}-${lIdx}`)
                        );
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              moduleDone ? "bg-emerald-400" : "bg-white/20"
                            }`}
                          />
                          <p className="text-white/60 text-xs truncate">{mod.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Done */}
          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 mx-auto mb-6 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="font-heading text-3xl font-extrabold text-white mb-2">
                Your course is ready!
              </h1>
              <p className="text-white/60 mb-4">Redirecting you to your course...</p>

              {failedLessons.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200/80 text-xs">
                    {failedLessons.length} lesson{failedLessons.length > 1 ? "s" : ""} could not be
                    generated and will have simplified content. You can still start your course.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 border border-red-500/30 rounded-3xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="font-heading text-2xl font-extrabold text-white mb-2">
                Generation failed
              </h1>
              <p className="text-white/60 mb-6 text-sm">{errorMsg}</p>
              <button
                onClick={() => router.push("/onboarding")}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Try again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
