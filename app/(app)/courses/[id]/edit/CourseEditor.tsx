"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
  GripVertical,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface EditorLesson {
  id: string;
  title: string;
  order_index: number;
  estimated_minutes: number;
  xp_reward: number;
}

export interface EditorModule {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: EditorLesson[];
}

interface Props {
  course: { id: string; title: string; domain: string; detected_level: string; status: string };
  modules: EditorModule[];
}

export default function CourseEditor({ course, modules: initialModules }: Props) {
  const [modules, setModules] = useState<EditorModule[]>(
    initialModules.map((m) => ({
      ...m,
      lessons: [...(m.lessons ?? [])].sort((a, b) => a.order_index - b.order_index),
    })).sort((a, b) => a.order_index - b.order_index)
  );
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState<{ type: "module" | "lesson"; id: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { type: "module"; moduleId: string; title: string }
    | { type: "lesson"; moduleId: string; lessonId: string; title: string }
    | null
  >(null);
  const supabase = createClient();
  const router = useRouter();

  // ---- Reorder helpers ----

  function moveModule(index: number, dir: -1 | 1) {
    const next = [...modules];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setModules(next.map((m, i) => ({ ...m, order_index: i })));
  }

  function moveLesson(moduleId: string, lessonIndex: number, dir: -1 | 1) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const lessons = [...m.lessons];
        const swap = lessonIndex + dir;
        if (swap < 0 || swap >= lessons.length) return m;
        [lessons[lessonIndex], lessons[swap]] = [lessons[swap], lessons[lessonIndex]];
        return { ...m, lessons: lessons.map((l, i) => ({ ...l, order_index: i })) };
      })
    );
  }

  // ---- Inline edit helpers ----

  function startEdit(type: "module" | "lesson", id: string, currentTitle: string) {
    setEditingTitle({ type, id });
    setEditValue(currentTitle);
  }

  function commitEdit() {
    if (!editingTitle) return;
    const trimmed = editValue.trim();
    if (!trimmed) { cancelEdit(); return; }

    if (editingTitle.type === "module") {
      setModules((prev) =>
        prev.map((m) => m.id === editingTitle.id ? { ...m, title: trimmed } : m)
      );
    } else {
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l.id === editingTitle.id ? { ...l, title: trimmed } : l
          ),
        }))
      );
    }
    setEditingTitle(null);
  }

  function cancelEdit() {
    setEditingTitle(null);
  }

  // ---- Delete helpers ----

  function deleteLesson(moduleId: string, lessonId: string) {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const lessons = m.lessons
          .filter((l) => l.id !== lessonId)
          .map((l, i) => ({ ...l, order_index: i }));
        return { ...m, lessons };
      })
    );
  }

  function deleteModule(moduleId: string) {
    setModules((prev) =>
      prev.filter((m) => m.id !== moduleId).map((m, i) => ({ ...m, order_index: i }))
    );
  }

  // ---- Save ----

  async function handleSave() {
    setSaving(true);
    try {
      // Update each module individually (upsert requires all NOT NULL columns)
      await Promise.all(
        modules.map((mod) =>
          supabase
            .from("modules")
            .update({ title: mod.title, order_index: mod.order_index })
            .eq("id", mod.id)
            .then(({ error }) => { if (error) throw error; })
        )
      );

      // Update each lesson individually
      await Promise.all(
        modules.flatMap((mod) =>
          mod.lessons.map((lesson) =>
            supabase
              .from("lessons")
              .update({ title: lesson.title, order_index: lesson.order_index })
              .eq("id", lesson.id)
              .then(({ error }) => { if (error) throw error; })
          )
        )
      );

      // Handle deletions — find ids that no longer exist
      const allModuleIds = modules.map((m) => m.id);
      const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
      const initialModuleIds = initialModules.map((m) => m.id);
      const initialLessonIds = initialModules.flatMap((m) => (m.lessons ?? []).map((l) => l.id));

      const deletedModuleIds = initialModuleIds.filter((id) => !allModuleIds.includes(id));
      const deletedLessonIds = initialLessonIds.filter((id) => !allLessonIds.includes(id));

      if (deletedLessonIds.length > 0) {
        await supabase.from("lessons").delete().in("id", deletedLessonIds);
      }
      if (deletedModuleIds.length > 0) {
        await supabase.from("modules").delete().in("id", deletedModuleIds);
      }

      toast.success("Course saved!");
      router.push(`/courses/${course.id}`);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Course
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{course.domain}</p>
            <h1 className="font-heading text-2xl font-extrabold text-foreground">{course.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Drag to reorder · click the pencil to rename · trash to delete
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-[#6d28d9] text-white font-semibold rounded-xl shadow-md shadow-primary/25 cursor-pointer flex-shrink-0"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </motion.div>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((mod, modIndex) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: modIndex * 0.04 }}
            className="glass-card rounded-2xl border border-primary/10 overflow-hidden"
          >
            {/* Module header */}
            <div className="flex items-center gap-3 p-4 bg-primary/3 border-b border-primary/8">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {modIndex + 1}
              </div>

              {/* Title / edit */}
              {editingTitle?.type === "module" && editingTitle.id === mod.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                    className="h-8 text-sm rounded-lg border-primary/20 focus-visible:ring-primary/20"
                    autoFocus
                  />
                  <button onClick={commitEdit} className="text-emerald-600 hover:text-emerald-700 cursor-pointer"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <span className="font-semibold text-sm text-foreground flex-1">{mod.title}</span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => startEdit("module", mod.id, mod.title)}
                  className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  title="Rename module"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveModule(modIndex, -1)}
                  disabled={modIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveModule(modIndex, 1)}
                  disabled={modIndex === modules.length - 1}
                  className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: "module", moduleId: mod.id, title: mod.title })}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete module"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Lessons */}
            <div>
              {mod.lessons.length === 0 && (
                <p className="px-5 py-4 text-sm text-muted-foreground italic">No lessons in this module.</p>
              )}
              {mod.lessons.map((lesson, lessonIndex) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-primary/5 last:border-0 hover:bg-primary/2 transition-colors group"
                >
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />

                  {/* Title / edit */}
                  {editingTitle?.type === "lesson" && editingTitle.id === lesson.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                        className="h-7 text-sm rounded-lg border-primary/20 focus-visible:ring-primary/20"
                        autoFocus
                      />
                      <button onClick={commitEdit} className="text-emerald-600 hover:text-emerald-700 cursor-pointer"><Check className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="text-sm text-foreground flex-1">
                      {lessonIndex + 1}. {lesson.title}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                    {lesson.estimated_minutes}m · {lesson.xp_reward} XP
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit("lesson", lesson.id, lesson.title)}
                      className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Rename lesson"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveLesson(mod.id, lessonIndex, -1)}
                      disabled={lessonIndex === 0}
                      className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveLesson(mod.id, lessonIndex, 1)}
                      disabled={lessonIndex === mod.lessons.length - 1}
                      className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: "lesson", moduleId: mod.id, lessonId: lesson.id, title: lesson.title })}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete lesson"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No modules found in this course.</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirm?.type === "module" ? "Delete module?" : "Delete lesson?"}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "module"
                ? <>This will remove <strong>{deleteConfirm.title}</strong> and all its lessons. Changes are not saved until you click "Save Changes".</>
                : <>This will remove the lesson <strong>{deleteConfirm?.title}</strong>. Changes are not saved until you click "Save Changes".</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl cursor-pointer" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white cursor-pointer"
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === "module") {
                  deleteModule(deleteConfirm.moduleId);
                } else {
                  deleteLesson(deleteConfirm.moduleId, deleteConfirm.lessonId);
                }
                setDeleteConfirm(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
