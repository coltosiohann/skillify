import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_KEY } from "@/lib/theme";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skillify — AI-Powered Learning Paths",
  description:
    "Tell us what you want to master. We build the plan. AI-generated courses tailored to your level and timeline.",
  keywords: ["learning", "AI", "courses", "skill", "education", "roadmap"],
  openGraph: {
    title: "Skillify — AI-Powered Learning Paths",
    description: "AI-generated courses tailored to your level and timeline.",
    type: "website",
  },
};

// Inline script to apply theme before first paint — prevents white flash
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_KEY)}) || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Anti-FOUC: beforeInteractive must be placed in body (not inside <head>) in App Router —
            Next.js automatically injects it before hydration in the correct position */}
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
