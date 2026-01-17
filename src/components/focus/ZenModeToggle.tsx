"use client";

import React from "react";
import { Maximize2, Minimize2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ZenModeToggleProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ZenModeToggle: React.FC<ZenModeToggleProps> = ({
  isActive,
  onToggle,
  disabled = false,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={isActive ? "exit" : "enter"}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={onToggle}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
          ${isActive 
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isActive ? (
          <>
            <Minimize2 className="w-4 h-4" />
            Exit Zen
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4" />
            Zen Mode
          </>
        )}
      </motion.button>
    </AnimatePresence>
  );
};
