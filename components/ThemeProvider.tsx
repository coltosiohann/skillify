"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Theme, THEME_KEY, resolveTheme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolved: "light",
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  // Apply .dark class to <html>
  const applyTheme = useCallback((t: Theme) => {
    const resolved = resolveTheme(t);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, []);

  // On mount — read from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    applyTheme(stored);
  }, [applyTheme]);

  // Watch system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem(THEME_KEY, t);
      applyTheme(t);
    },
    [applyTheme]
  );

  const resolved = resolveTheme(theme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}
