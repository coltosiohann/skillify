"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BillingSuccessPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  // Poll /api/stripe/subscription for up to 10 s waiting on the webhook
  useEffect(() => {
    let attempts = 0;
    const max = 10;

    async function poll() {
      try {
        const res = await fetch("/api/stripe/subscription");
        const { subscription } = await res.json();
        if (subscription) {
          setConfirmed(true);
          return;
        }
      } catch {
        // ignore — keep polling
      }

      attempts++;
      if (attempts < max) {
        setTimeout(poll, 1000);
      } else {
        // Webhook may be slightly delayed — show success anyway
        setConfirmed(true);
      }
    }

    poll();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-card border border-primary/10 rounded-3xl p-10 shadow-xl"
      >
        {confirmed ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-foreground mb-2">
              You&apos;re on Pro! 🎉
            </h1>
            <p className="text-muted-foreground mb-8">
              Your subscription is active. Enjoy unlimited courses, PDF uploads, and everything Pro has to offer.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-primary hover:bg-[#4338CA] text-white gap-2 shadow-md shadow-primary/20"
              >
                <Sparkles className="w-4 h-4" /> Go to Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/settings?tab=billing")}
                className="rounded-xl text-muted-foreground"
              >
                View billing settings
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-9 h-9 text-primary animate-spin" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-foreground mb-2">
              Confirming your subscription…
            </h1>
            <p className="text-muted-foreground">This only takes a moment.</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
