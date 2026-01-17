"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/Button";
import type { TimerTheme } from "@/hooks/useFocusTimerLogic";

interface ThemeSelectorProps {
  currentTheme: TimerTheme;
  onSelect: (theme: TimerTheme) => void;
  disabled?: boolean;
}

const THEMES: { id: TimerTheme; name: string; colors: string; preview: string }[] = [
  {
    id: "default",
    name: "Default",
    colors: "from-purple-500 to-pink-500",
    preview: "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
  },
  {
    id: "light",
    name: "Light",
    colors: "from-slate-300 to-slate-500",
    preview: "bg-gradient-to-br from-slate-100 to-slate-200"
  },
  {
    id: "amber",
    name: "Amber",
    colors: "from-amber-400 to-orange-500",
    preview: "bg-gradient-to-br from-amber-400/20 to-orange-500/20"
  },
  {
    id: "mono",
    name: "Mono",
    colors: "from-zinc-400 to-zinc-600",
    preview: "bg-gradient-to-br from-zinc-700 to-zinc-800"
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Timer Theme
      </label>

      <div className="grid grid-cols-4 gap-2">
        {THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={() => onSelect(theme.id)}
            disabled={disabled}
            className={cn(
              "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
              currentTheme === theme.id
                ? `border-purple-500 ${theme.preview}`
                : "border-border bg-card hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full bg-gradient-to-br",
              theme.colors
            )} />
            <span className="text-[10px] font-bold text-foreground">
              {theme.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
