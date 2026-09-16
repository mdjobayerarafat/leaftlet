"use client";

import { useTheme, type ThemeChoice } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: ThemeChoice; label: string; description: string }> = [
  { value: "light", label: "Light", description: "Warm off-white" },
  { value: "sepia", label: "Sepia", description: "Paper-like" },
  { value: "dark", label: "Dark", description: "Night reading" },
  { value: "system", label: "System", description: "Match device" },
];

export function SettingsThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          className={cn(
            "rounded-xl border p-3 text-left transition-colors",
            theme === option.value ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
          )}
        >
          <span className={cn("block text-sm font-semibold", theme === option.value ? "text-primary" : "text-foreground")}>{option.label}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
