import Link from "next/link";
import { Zap } from "lucide-react";
import LightModeWrapper from "@/app/(landing)/LightModeWrapper";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LightModeWrapper>
      <div className="min-h-screen hero-glow sparkle-bg flex items-center justify-center px-4 py-12">
        {/* Logo top-left */}
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">Skillify</span>
        </Link>
        {children}
      </div>
    </LightModeWrapper>
  );
}
