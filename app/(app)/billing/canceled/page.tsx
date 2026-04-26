"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BillingCanceledPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-card border border-primary/10 rounded-3xl p-10 shadow-xl"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-muted-foreground" />
        </div>
        <h1 className="font-heading font-extrabold text-2xl text-foreground mb-2">
          No problem!
        </h1>
        <p className="text-muted-foreground mb-8">
          You can upgrade to Pro any time from your settings.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-primary hover:bg-[#4338CA] text-white shadow-md shadow-primary/20"
          >
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/settings?tab=billing")}
            className="rounded-xl text-muted-foreground"
          >
            View plans
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
