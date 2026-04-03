"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, Trophy, Zap, Star, CheckCircle, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  course: {
    id: string;
    title: string;
    domain: string;
    detected_level: string;
    duration_weeks: number;
    status: string;
    created_at: string;
  };
  recipientName: string;
  totalXp: number;
  completedAt: string;
  isPublic?: boolean;
  userId?: string;
}

const levelLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function CertificateView({ course, recipientName, totalXp, completedAt, isPublic: initialIsPublic = true, userId }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const supabase = createClient();

  async function togglePrivacy() {
    if (!userId) return;
    setTogglingPrivacy(true);
    const next = !isPublic;
    const { error } = await supabase
      .from("courses")
      .update({ is_public: next } as never)
      .eq("id", course.id)
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to update privacy setting");
    } else {
      setIsPublic(next);
      toast.success(next ? "Certificate is now public" : "Certificate is now private");
    }
    setTogglingPrivacy(false);
  }

  const completedDate = new Date(completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certId = `SKLFY-${course.id.slice(0, 8).toUpperCase()}`;

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `My ${course.title} Certificate`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Certificate link copied!");
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>
        <div className="flex items-center gap-2">
          {userId && (
            <Button
              variant="outline"
              size="sm"
              onClick={togglePrivacy}
              disabled={togglingPrivacy}
              className={`rounded-xl gap-1.5 cursor-pointer ${isPublic ? "border-primary/15" : "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"}`}
              title={isPublic ? "Certificate is public — click to make private" : "Certificate is private — click to make public"}
            >
              {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {isPublic ? "Public" : "Private"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-xl border-primary/15 gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="rounded-xl bg-primary hover:bg-[#6d28d9] text-white shadow-md shadow-primary/25 gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Save / Print
          </Button>
        </div>
      </div>

      {/* Certificate */}
      <motion.div
        ref={certRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border border-primary/10 print:shadow-none print:border-0"
      >
        {/* Top gradient bar */}
        <div className="h-3 bg-gradient-to-r from-primary via-violet-500 to-amber-400" />

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-16 h-16 rounded-full border-2 border-primary/10 opacity-40" />
        <div className="absolute top-8 left-8 w-10 h-10 rounded-full border-2 border-primary/15 opacity-40" />
        <div className="absolute top-8 right-8 w-16 h-16 rounded-full border-2 border-primary/10 opacity-40" />
        <div className="absolute top-8 right-8 w-10 h-10 rounded-full border-2 border-primary/15 opacity-40" />
        <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full border-2 border-primary/10 opacity-40" />
        <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full border-2 border-primary/10 opacity-40" />

        <div className="px-12 py-10 text-center relative">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-heading font-bold text-xl text-gray-800">Skillify</span>
          </div>

          {/* Trophy icon */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-100">
            <Trophy className="w-10 h-10 text-amber-500" />
          </div>

          {/* Certificate of completion */}
          <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">
            Certificate of Completion
          </p>

          <p className="text-base text-gray-500 mb-3">This certifies that</p>

          <h2 className="font-heading text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
            {recipientName}
          </h2>

          <p className="text-base text-gray-500 mb-4">has successfully completed</p>

          <div className="inline-block bg-gradient-to-br from-primary/8 to-violet-50 border border-primary/15 rounded-2xl px-8 py-4 mb-6">
            <h3 className="font-heading text-2xl font-extrabold text-gray-900 mb-1">
              {course.title}
            </h3>
            <p className="text-sm text-primary font-medium">{course.domain}</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary font-bold text-lg mb-0.5">
                <Star className="w-4 h-4 fill-primary" />
                {levelLabel[course.detected_level] ?? course.detected_level}
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Level</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-lg mb-0.5">
                <Zap className="w-4 h-4" />
                {course.duration_weeks}w
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Duration</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-lg mb-0.5">
                <CheckCircle className="w-4 h-4" />
                Passed
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
            <div className="w-2 h-2 rounded-full bg-primary/30" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
          </div>

          {/* Date + Certificate ID */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="text-left">
              <p className="font-medium text-gray-600 mb-0.5">Completed</p>
              <p>{completedDate}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto shadow-md shadow-primary/30">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-600 mb-0.5">Certificate ID</p>
              <p className="font-mono">{certId}</p>
            </div>
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-amber-400" />
      </motion.div>

      {/* XP earned callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 glass-card rounded-2xl border border-primary/10 p-5 flex items-center gap-4 print:hidden"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">Course XP banked</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You've earned XP from all lessons and quizzes in this course. Your total is{" "}
            <span className="font-bold text-amber-600">{totalXp.toLocaleString()} XP</span>.
          </p>
        </div>
        <Link href="/achievements">
          <Button variant="outline" size="sm" className="rounded-xl border-primary/15 cursor-pointer text-xs flex-shrink-0">
            View Achievements
          </Button>
        </Link>
      </motion.div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-cert], [data-cert] * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}
