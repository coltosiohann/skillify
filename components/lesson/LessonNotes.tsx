"use client";

import { useState, useEffect, useCallback } from "react";
import { StickyNote, ChevronDown, ChevronUp, Save, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  lessonId: string;
  userId: string;
  initialNote: string;
}

export default function LessonNotes({ lessonId, userId, initialNote }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  // Autosave with debounce
  const saveNote = useCallback(async (content: string) => {
    setSaving(true);
    try {
      await supabase.from("lesson_notes").upsert(
        { user_id: userId, lesson_id: lessonId, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [supabase, userId, lessonId]);

  useEffect(() => {
    if (note === initialNote) return;
    const timer = setTimeout(() => saveNote(note), 1000);
    return () => clearTimeout(timer);
  }, [note, initialNote, saveNote]);

  return (
    <div className="glass-card rounded-3xl border border-primary/10 shadow-lg shadow-primary/5 overflow-hidden mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-primary/3 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <StickyNote className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-semibold text-foreground text-sm flex-1">My Notes</span>
        {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
        {saved && !saving && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your notes for this lesson… (auto-saved)"
            rows={6}
            className="w-full resize-y rounded-xl border border-primary/15 bg-background p-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            style={{ fontSize: "16px" }}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">Notes are auto-saved as you type</p>
            <button
              onClick={() => saveNote(note)}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
