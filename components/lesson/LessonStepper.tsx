"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen, Code2, Layers, Wrench } from "lucide-react";
import type { LessonContent } from "@/lib/types/lesson-content";
import KnowledgeCheckCard from "./KnowledgeCheckCard";
import KeyTakeaways from "./KeyTakeaways";
import PracticeChallengeCard from "./PracticeChallengeCard";

interface Props {
  content: LessonContent;
  onAllSectionsViewed: () => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  concept: <BookOpen className="w-4 h-4" />,
  example: <Code2 className="w-4 h-4" />,
  "deep-dive": <Layers className="w-4 h-4" />,
  practice: <Wrench className="w-4 h-4" />,
};

const sectionColors: Record<string, string> = {
  concept: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  example: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  "deep-dive": "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300",
  practice: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
};

const sectionLabels: Record<string, string> = {
  concept: "Concept",
  example: "Example",
  "deep-dive": "Deep Dive",
  practice: "Practice",
};

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );
}

function renderSectionMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={i} className="text-xl font-bold text-foreground mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={i} className="text-2xl font-extrabold text-foreground mt-5 mb-3 font-heading">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={i}
          className="bg-[#1e1b4b] text-white/85 rounded-2xl p-4 text-sm font-mono overflow-x-auto my-3 leading-relaxed"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={i} className="list-none space-y-1.5 my-3">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-foreground/80">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (line.trim() === "") {
      // skip empty
    } else {
      nodes.push(
        <p
          key={i}
          className="text-foreground/80 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    i++;
  }
  return nodes;
}

export default function LessonStepper({ content, onAllSectionsViewed }: Props) {
  const [revealedCount, setRevealedCount] = useState(1);
  const [answeredChecks, setAnsweredChecks] = useState<Set<string>>(new Set());

  const totalSections = content.sections.length;
  const allRevealed = revealedCount >= totalSections;

  // Call onAllSectionsViewed in an effect, never during render
  useEffect(() => {
    if (revealedCount >= totalSections) {
      onAllSectionsViewed();
    }
  }, [revealedCount, totalSections, onAllSectionsViewed]);

  const revealNext = useCallback(() => {
    setRevealedCount((c) => Math.min(c + 1, totalSections));
  }, [totalSections]);

  const handleCheckAnswered = useCallback(
    (afterSection: string) => {
      setAnsweredChecks((prev) => new Set(prev).add(afterSection));
    },
    []
  );

  // Find knowledge checks for a given section
  function getChecksAfterSection(sectionId: string) {
    return content.knowledge_checks.filter((kc) => kc.after_section === sectionId);
  }

  // Determine if a knowledge check is blocking the "Continue" button
  function isBlocked(sectionIndex: number): boolean {
    if (sectionIndex >= revealedCount - 1) return false;
    const section = content.sections[sectionIndex];
    const checks = getChecksAfterSection(section.id);
    return checks.some((kc) => !answeredChecks.has(kc.after_section));
  }

  // Can reveal next?
  const currentSection = content.sections[revealedCount - 1];
  const currentChecks = currentSection ? getChecksAfterSection(currentSection.id) : [];
  const currentChecksDone = currentChecks.every((kc) => answeredChecks.has(kc.after_section));
  const canContinue = !allRevealed && currentChecksDone;

  return (
    <div className="relative">
      {/* Step indicator line */}
      <div className="absolute left-0 top-0 bottom-0 w-8 hidden md:block">
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-primary/10" />
        {content.sections.map((_, i) => (
          <div
            key={i}
            className={`absolute left-[11px] w-[9px] h-[9px] rounded-full border-2 transition-all duration-300 ${
              i < revealedCount
                ? "bg-primary border-primary"
                : "bg-background border-primary/20"
            }`}
            style={{ top: `${(i / Math.max(totalSections - 1, 1)) * 90 + 5}%` }}
          />
        ))}
      </div>

      <div className="md:pl-12 space-y-0">
        <AnimatePresence mode="sync">
          {content.sections.slice(0, revealedCount).map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Section card */}
              <div className="glass-card rounded-2xl p-6 mb-4 shadow-sm border border-primary/8">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sectionColors[section.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {sectionIcons[section.type] ?? <BookOpen className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {sectionLabels[section.type] ?? section.type}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {i + 1}/{totalSections}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold text-foreground mb-3">
                  {section.title}
                </h3>

                <div className="prose max-w-none">
                  {renderSectionMarkdown(section.content_markdown)}
                </div>
              </div>

              {/* Knowledge checks after this section */}
              {getChecksAfterSection(section.id).map((kc, j) => (
                <KnowledgeCheckCard
                  key={`${section.id}-check-${j}`}
                  check={kc}
                  onAnswered={() => handleCheckAnswered(kc.after_section)}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Continue button */}
        {canContinue && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center py-4"
          >
            <button
              type="button"
              onClick={revealNext}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-[#6d28d9] text-white rounded-xl font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 cursor-pointer active:scale-[0.97]"
            >
              Continue
              <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Key Takeaways — show after all sections revealed */}
        {allRevealed && content.key_takeaways.length > 0 && (
          <KeyTakeaways takeaways={content.key_takeaways} />
        )}

        {/* Practice Challenge — show after all sections revealed */}
        {allRevealed && content.practice_challenge && (
          <PracticeChallengeCard challenge={content.practice_challenge} />
        )}
      </div>
    </div>
  );
}
