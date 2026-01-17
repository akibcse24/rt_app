import React from "react";
import { Button } from "@/components/ui/Button";
import { Play, Pause, RotateCcw, Coffee, Zap, Moon, Plus, Minus, Flag } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SessionControlsProps {
  isActive: boolean;
  isPaused: boolean;
  isOvertime: boolean;
  isZen?: boolean;
  sessionType: "focus" | "shortBreak" | "longBreak";
  onToggle: () => void;
  onReset: () => void;
  onSetSession: (type: "focus" | "shortBreak" | "longBreak") => void;
  onAdjustTime?: (deltaMinutes: number) => void;
  onLogDistraction?: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  isActive,
  isPaused,
  isOvertime,
  isZen = false,
  sessionType,
  onToggle,
  onReset,
  onSetSession,
  onAdjustTime,
  onLogDistraction,
}) => {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Session Type Tabs - Hidden in Zen */}
      {!isZen && (
        <div className="flex w-full rounded-2xl bg-muted p-1.5 border border-border">
          <SessionButton
            active={sessionType === "focus"}
            onClick={() => onSetSession("focus")}
            icon={Zap}
            label="Focus"
          />
          <SessionButton
            active={sessionType === "shortBreak"}
            onClick={() => onSetSession("shortBreak")}
            icon={Coffee}
            label="Short"
          />
          <SessionButton
            active={sessionType === "longBreak"}
            onClick={() => onSetSession("longBreak")}
            icon={Moon}
            label="Long"
          />
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-6">
        {/* Time Adjustment Buttons (when active/paused and not overtime) */}
        {isActive && !isOvertime && onAdjustTime && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAdjustTime(-5)}
              className={cn(
                "h-12 w-12 rounded-xl border transition-all flex items-center justify-center",
                isZen
                  ? "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-transparent"
              )}
              title="Remove 5 minutes"
            >
              <Minus className="w-5 h-5" />
            </motion.button>
          </>
        )}

        {/* Main Play/Pause Button */}
        <Button
          onClick={onToggle}
          className={cn(
            "h-20 w-20 sm:h-24 sm:w-24 rounded-[2rem] transition-all transform hover:scale-105 active:scale-95 shadow-xl",
            isZen && "bg-zinc-100 text-black border-2 border-white/20 hover:bg-white shadow-white/5",
            !isZen && isActive && !isPaused && !isOvertime && "bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/80",
            !isZen && isOvertime && "bg-amber-500 text-white border-2 border-amber-400 shadow-amber-500/25 hover:bg-amber-600",
            !isZen && !isActive && "bg-primary text-primary-foreground border-0 shadow-primary/25 hover:bg-primary/90"
          )}
        >
          {isActive && !isPaused ? (
            <Pause className="h-10 w-10" />
          ) : (
            <Play className="h-10 w-10 ml-1 fill-current" />
          )}
        </Button>

        {/* Time Adjustment and Reset Buttons */}
        <div className="flex items-center gap-3">
          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: -45 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className={cn(
              "h-12 w-12 rounded-xl border flex items-center justify-center transition-all",
              isZen
                ? "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white"
                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>

          {/* Time Add Button (when active/paused and not overtime) */}
          {isActive && !isOvertime && onAdjustTime && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAdjustTime(5)}
              className={cn(
                "h-12 w-12 rounded-xl border transition-all flex items-center justify-center",
                isZen
                  ? "bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 border border-transparent"
              )}
              title="Add 5 minutes"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          )}

          {/* Distraction Log Button (when paused, hidden in zen) */}
          {isPaused && onLogDistraction && !isZen && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogDistraction}
              className="h-12 w-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center transition-all"
              title="Log distraction"
            >
              <Flag className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Overtime indicator */}
      {isOvertime && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Flow State Active - Keep Going!
        </motion.div>
      )}

      {/* Pause indicator */}
      {isActive && isPaused && !isOvertime && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-bold"
        >
          Paused
        </motion.div>
      )}
    </div>
  );
};

function SessionButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all uppercase tracking-widest",
        active
          ? "bg-background text-foreground shadow-sm border border-border"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-background/50"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "opacity-60")} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export { SessionControls };
