"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type GenState = "generating" | "saving" | "done" | "error";

const STEPS = [
  "Analyzing your learning goals...",
  "Structuring course modules...",
  "Crafting lesson content...",
  "Adding resources & examples...",
  "Personalizing to your level...",
  "Finalizing your course...",
];

export default function GeneratingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [state, setState] = useState<GenState>("generating");
  const [streamText, setStreamText] = useState("");
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rotate loading step labels
  useEffect(() => {
    if (state !== "generating") return;
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [state]);

  // Animate progress bar during generation
  useEffect(() => {
    if (state !== "generating") return;
    const target = 85;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= target) return p;
        return p + Math.random() * 2.5;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [state]);

  async function generate() {
    const raw = localStorage.getItem("skillify_wizard");
    if (!raw) {
      setErrorMsg("Wizard data not found. Please start over.");
      setState("error");
      return;
    }

    const wizard = JSON.parse(raw);
    let fullText = "";

    try {
      // Stream course generation
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: wizard.domain,
          level: wizard.detectedLevel,
          durationWeeks: wizard.durationWeeks,
          minutesPerDay: wizard.minutesPerDay,
          learningStyle: wizard.learningStyle,
          pdfContext: wizard.extractedText ?? undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Generation failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        if (fullText.includes("__ERROR__:")) {
          throw new Error(fullText.split("__ERROR__:")[1]);
        }

        // Show a preview (last 300 chars of streamed content)
        setStreamText(fullText.slice(-300));
      }

      // Parse JSON
      setState("saving");
      setProgress(90);
      const cleaned = fullText.replace(/```json\s*|```/g, "").trim();
      const course = JSON.parse(cleaned);

      // Save to Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert course
      const { data: courseRow, error: courseErr } = await supabase
        .from("courses")
        .insert({
          user_id: user.id,
          title: course.title,
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

      // Insert modules + lessons
      for (const mod of course.modules ?? []) {
        const { data: modRow, error: modErr } = await supabase
          .from("modules")
          .insert({
            course_id: cId,
            title: mod.title,
            description: mod.description ?? "",
            order_index: mod.order_index ?? 0,
            duration_days: mod.duration_days ?? 7,
          })
          .select("id")
          .single();

        if (modErr) throw modErr;

        for (const lesson of mod.lessons ?? []) {
          const { error: lessonErr } = await supabase.from("lessons").insert({
            module_id: modRow.id,
            title: lesson.title,
            content_markdown: lesson.content_markdown ?? "",
            content_json: lesson.content_json ?? null,
            resources_json: lesson.resources_json ?? [],
            order_index: lesson.order_index ?? 0,
            xp_reward: lesson.xp_reward ?? 50,
            estimated_minutes: lesson.estimated_minutes ?? 5,
            difficulty: lesson.difficulty ?? "standard",
          });
          if (lessonErr) throw lessonErr;
        }
      }

      // Link document if uploaded
      if (wizard.documentId) {
        await supabase
          .from("documents")
          .update({ course_id: cId })
          .eq("id", wizard.documentId);
      }

      localStorage.removeItem("skillify_wizard");
      setCourseId(cId);
      setProgress(100);
      setState("done");

      setTimeout(() => router.push(`/courses/${cId}`), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorMsg(msg);
      setState("error");
      toast.error(msg);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #4c1d95, #6d28d9 30%, #7c3aed 60%, #1e1b4b)",
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
          {(state === "generating" || state === "saving") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="text-center"
            >
              {/* Animated logo/icon */}
              <motion.div
                className="w-20 h-20 mx-auto mb-8 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
              >
                <Zap className="w-10 h-10 text-amber-400" />
              </motion.div>

              <h1 className="font-heading text-3xl font-extrabold text-white mb-2">
                {state === "saving" ? "Saving your course..." : "Building your course..."}
              </h1>

              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/60 mb-8"
                >
                  {state === "saving" ? "Writing to database..." : STEPS[stepIndex]}
                </motion.p>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-400 to-amber-400 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Stream preview */}
              {streamText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left"
                >
                  <p className="text-xs text-white/40 uppercase tracking-wide mb-2 font-medium">AI Output</p>
                  <p className="text-white/60 text-xs font-mono leading-relaxed line-clamp-4 break-all">
                    {streamText}
                    <span className="inline-block w-1.5 h-3.5 bg-white/60 ml-0.5 animate-pulse align-middle" />
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Done */}
          {state === "done" && (
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
              <p className="text-white/60">Redirecting you to your course...</p>
            </motion.div>
          )}

          {/* Error */}
          {state === "error" && (
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
