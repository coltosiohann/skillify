"use client";

import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";

interface Props {
  takeaways: string[];
}

export default function KeyTakeaways({ takeaways }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 my-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-emerald-600" />
        </div>
        <span className="text-sm font-semibold text-emerald-700">Key Takeaways</span>
      </div>

      <div className="space-y-2.5">
        {takeaways.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-emerald-700" />
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{t}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
