"use client";

import React from "react";
import { Clock, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/components/ui/Button";

interface ModeToggleProps {
  mode: "timer" | "stopwatch";
  onToggle: () => void;
  disabled?: boolean;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="relative">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        <motion.button
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all",
            mode === "timer"
              ? "bg-purple-500/20 text-purple-400"
              : "text-muted-foreground hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Timer className="w-4 h-4" />
          Timer
        </motion.button>
        
        <motion.button
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all",
            mode === "stopwatch"
              ? "bg-purple-500/20 text-purple-400"
              : "text-muted-foreground hover:text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Clock className="w-4 h-4" />
          Stopwatch
        </motion.button>
      </div>
    </div>
  );
};
