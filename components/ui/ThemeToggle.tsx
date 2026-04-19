"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import type { Theme } from "@/lib/theme";

const options: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "system", icon: Monitor, label: "System" },
  { value: "dark", icon: Moon, label: "Dark" },
];

interface Props {
  /** "icon" = compact 3-icon row for Topbar; "card" = full card for Settings */
  variant?: "icon" | "card";
}

export default function ThemeToggle({ variant = "icon" }: Props) {
  const { theme, setTheme } = useTheme();

  if (variant === "card") {
    return (
      <div className="grid grid-cols-3 gap-3">
        {options.map(({ value, icon: Icon, label }) => {
          const active = theme === value;
          const preview =
            value === "light"
              ? "bg-white"
              : value === "dark"
              ? "bg-[#0F172A]"
              : "bg-gradient-to-br from-white to-[#0F172A]";

          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                active
                  ? "border-primary shadow-md shadow-primary/15"
                  : "border-primary/10 hover:border-primary/30"
              }`}
            >
              <div
                className={`h-12 rounded-lg mb-3 ${preview} border border-primary/10 flex items-center justify-center`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    value === "dark"
                      ? "text-violet-300"
                      : value === "system"
                      ? "text-gray-500"
                      : "text-amber-500"
                  }`}
                />
              </div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              {active && (
                <p className="text-xs text-primary font-medium mt-0.5">Active</p>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // icon variant — compact pill for Topbar
  return (
    <div className="flex items-center gap-0.5 bg-primary/8 rounded-xl p-1">
      {options.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            aria-label={`Switch to ${label} mode`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              active
                ? "bg-white shadow-sm text-primary dark:bg-primary dark:text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
