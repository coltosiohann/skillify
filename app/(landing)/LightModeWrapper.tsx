"use client";

import { useEffect } from "react";

export default function LightModeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");

    // ThemeProvider (root layout) runs its effect after ours and re-adds .dark
    // Use a MutationObserver to immediately remove it whenever it gets added back
    const observer = new MutationObserver(() => {
      if (html.classList.contains("dark")) {
        html.classList.remove("dark");
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      if (wasDark) html.classList.add("dark");
    };
  }, []);

  return <>{children}</>;
}
