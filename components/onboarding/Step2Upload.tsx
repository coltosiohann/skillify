"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WizardData } from "@/app/(app)/onboarding/page";

interface Props {
  data: WizardData;
  onNext: (patch: Partial<WizardData>) => void;
  onBack: () => void;
}

type UploadState = "idle" | "uploading" | "done" | "error";

export default function Step2Upload({ data, onNext, onBack }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [documentId, setDocumentId] = useState<string | null>(data.documentId);
  const [extractedText, setExtractedText] = useState<string | null>(data.extractedText);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB.");
      return;
    }
    setFile(f);
    setUploadState("uploading");

    const formData = new FormData();
    formData.append("file", f);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setDocumentId(json.id);
      setExtractedText(json.extractedText);
      setUploadState("done");
      if (json.truncated) {
        toast.warning("PDF was large — only the first portion was used for course generation.");
      } else {
        toast.success("File uploaded and text extracted!");
      }
    } catch (err) {
      setUploadState("error");
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  function handleSkip() {
    onNext({ documentId: null, extractedText: null });
  }

  function handleContinue() {
    onNext({ documentId, extractedText });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -32 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className="w-full max-w-xl"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          Step 2 of 4
        </div>
        <h1 className="font-heading text-4xl font-extrabold text-foreground mb-3">
          Upload your{" "}
          <span className="text-gradient">materials</span>
        </h1>
        <p className="text-muted-foreground">
          Have notes or a syllabus? We&apos;ll use them to personalize your course.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-5 sm:p-8 shadow-xl shadow-primary/10">
        {uploadState !== "done" ? (
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-primary/20 hover:border-primary/40 hover:bg-primary/3"
            }`}
            onClick={() => document.getElementById("pdf-input")?.click()}
          >
            <input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {uploadState === "uploading" ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">
                  Uploading & extracting text...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Drop your PDF here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse — max 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-2xl">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{file?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700">
                  {extractedText?.length?.toLocaleString()} characters extracted
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setUploadState("idle"); setDocumentId(null); setExtractedText(null); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-green-700" />
            </button>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {/* Skip + Continue — always share full width */}
          <div className="flex gap-2">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer flex-1"
            >
              Skip this step
            </Button>
            <Button
              onClick={handleContinue}
              disabled={uploadState === "uploading" || uploadState === "error"}
              className="gap-2 rounded-xl bg-primary text-white hover:bg-[#6d28d9] shadow-md shadow-primary/25 cursor-pointer flex-1 disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          {/* Back — full width below on mobile, keeps it from squeezing Continue */}
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full gap-2 rounded-xl border-primary/15 hover:bg-primary/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
