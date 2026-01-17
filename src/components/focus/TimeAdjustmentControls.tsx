"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface TimeAdjustmentControlsProps {
  onAdjust: (deltaMinutes: number) => void;
  disabled?: boolean;
}

export const TimeAdjustmentControls: React.FC<TimeAdjustmentControlsProps> = ({
  onAdjust,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => onAdjust(-5)}
        disabled={disabled}
        className={`
          h-10 w-10 rounded-xl flex items-center justify-center transition-all
          bg-white/5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30
          border border-transparent disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Remove 5 minutes"
      >
        <Minus className="w-4 h-4" />
      </motion.button>
      
      <span className="text-xs text-muted-foreground font-medium min-w-[80px] text-center">
        Adjust Time
      </span>
      
      <motion.button
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => onAdjust(5)}
        disabled={disabled}
        className={`
          h-10 w-10 rounded-xl flex items-center justify-center transition-all
          bg-white/5 text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30
          border border-transparent disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Add 5 minutes"
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  );
};
