"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import OAuthButtons from "@/components/auth/OAuthButtons";

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Cap at 3 visual levels
  const capped = Math.min(3, score) as 0 | 1 | 2 | 3;
  const labels = ["", "Weak", "Fair", "Strong"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"];
  const textColors = ["", "text-red-500", "text-amber-500", "text-emerald-600"];
  return { score: capped, label: labels[capped], color: `${colors[capped]} ${textColors[capped]}` };
}

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Capture intended plan from pricing page CTA (?plan=pro)
  const intendedPlan = searchParams.get("plan") ?? "free";

  const strength = getPasswordStrength(password);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    // Store intended plan in user metadata so it can be acted on post-signup
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, intended_plan: intendedPlan } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm.");
      router.push("/login");
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
      className="w-full max-w-md"
    >
      <div className="glass-card rounded-3xl p-8 shadow-xl shadow-primary/10">
        {intendedPlan === "pro" && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6">
            <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              You&apos;re signing up for <strong>Skillify Pro</strong>. Upgrade after confirming your email.
            </p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-extrabold text-foreground mb-2">Start learning today</h1>
          <p className="text-muted-foreground text-sm">Create your free account — no credit card needed</p>
        </div>

        <OAuthButtons />

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/10" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground bg-white px-3 w-fit mx-auto">
            or sign up with email
          </div>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Full name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 rounded-xl border-primary/15 focus-visible:ring-primary/30 bg-white"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 rounded-xl border-primary/15 focus-visible:ring-primary/30 bg-white"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 rounded-xl border-primary/15 focus-visible:ring-primary/30 bg-white"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength meter */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        strength.score >= lvl
                          ? lvl === 1 ? "bg-red-400" : lvl === 2 ? "bg-amber-400" : "bg-emerald-400"
                          : "bg-primary/10"
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-medium ${strength.score === 1 ? "text-red-500" : strength.score === 2 ? "text-amber-500" : "text-emerald-600"}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary text-white hover:bg-[#4338CA] shadow-md shadow-primary/25 transition-all duration-200 gap-2 mt-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <>Create Free Account <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline cursor-pointer">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-primary hover:underline cursor-pointer">Privacy Policy</Link>.
        </p>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline cursor-pointer">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
