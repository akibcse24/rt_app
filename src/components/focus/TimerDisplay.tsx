import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isActive: boolean;
  totalSeconds: number;
  isOvertime?: boolean;
  overtimeSeconds?: number;
  mode?: "timer" | "stopwatch";
  theme?: "default" | "light" | "amber" | "mono";
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  minutes,
  seconds,
  isActive,
  totalSeconds,
  isOvertime = false,
  overtimeSeconds = 0,
  mode = "timer",
  theme = "default"
}) => {
  // Calculate progress for timer mode
  const progress = mode === "timer"
    ? (totalSeconds > 0 ? (minutes * 60 + seconds) / totalSeconds : 1)
    : 0;

  // For stopwatch mode, calculate elapsed time
  const stopwatchMinutes = mode === "stopwatch" ? minutes : 0;
  const stopwatchSeconds = mode === "stopwatch" ? seconds : 0;

  // Format display based on mode
  const formatTime = (mins: number, secs: number, isOver: boolean) => {
    if (isOver) {
      // Overtime: show +MM:SS
      return `+${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    if (mode === "stopwatch") {
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const displayMinutes = isOvertime ? overtimeSeconds > 0 ? Math.floor(overtimeSeconds / 60) : minutes : (mode === "stopwatch" ? stopwatchMinutes : minutes);
  const displaySeconds = isOvertime ? overtimeSeconds > 0 ? overtimeSeconds % 60 : seconds : (mode === "stopwatch" ? stopwatchSeconds : seconds);

  // Theme configurations
  const getThemeColors = () => {
    switch (theme) {
      case "light":
        return {
          ring: "text-slate-200",
          progress: "stroke-slate-400",
          gradient: "from-slate-300 to-slate-500",
          bg: "bg-white/10",
          text: "text-slate-800",
          pulse: "animate-pulse"
        };
      case "amber":
        return {
          ring: "text-amber-900/20",
          progress: "stroke-amber-500",
          gradient: "from-amber-400 to-orange-500",
          bg: "bg-amber-500/5",
          text: "text-amber-500",
          pulse: ""
        };
      case "mono":
        return {
          ring: "text-zinc-800",
          progress: "stroke-zinc-500",
          gradient: "from-zinc-400 to-zinc-600",
          bg: "bg-zinc-900/40",
          text: "text-zinc-100 text-glow",
          pulse: ""
        };
      default:
        return {
          ring: "text-muted/20",
          progress: "stroke-purple-500",
          gradient: "from-purple-500 to-pink-500",
          bg: "bg-gradient-to-br from-purple-500/5 to-pink-500/5",
          text: "text-foreground",
          pulse: isActive && !isOvertime ? "animate-pulse" : ""
        };
    }
  };

  const colors = getThemeColors();
  const circumference = 2 * Math.PI * 150;
  const strokeDashoffset = mode === "timer"
    ? circumference - (progress * circumference)
    : 0;

  // Breathing animation for active focus
  const breathingClass = isActive && !isOvertime && mode === "timer"
    ? "animate-[bounce_4s_ease-in-out_infinite]"
    : "";

  return (
    <div className="flex items-center justify-center w-full">
      <div className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-1000 border",
        // Responsive sizing
        "w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96",
        colors.bg,
        isActive && !isOvertime ? breathingClass : "",
        (isOvertime || mode === "stopwatch") && "ring-4 ring-amber-500/30"
      )}>
        {/* Animated Progress Ring */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className={colors.ring}
          />
          {(isActive || isOvertime) && mode === "timer" && (
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="url(#timer-gradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                isOvertime && "stroke-amber-500"
              )}
            />
          )}
          {/* Stopwatch mode indicator ring */}
          {mode === "stopwatch" && isActive && (
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="url(#timer-gradient)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - ((stopwatchMinutes * 60 + stopwatchSeconds) / 3600) * circumference}
              strokeLinecap="round"
              className="transition-all duration-1000 opacity-60"
            />
          )}
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isOvertime ? "#f59e0b" : "#a855f7"} />
              <stop offset="100%" stopColor={isOvertime ? "#f97316" : "#ec4899"} />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex flex-col items-center">
          <span className={cn(
            "text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter drop-shadow-sm font-mono transition-all",
            colors.text,
            colors.pulse,
            isOvertime && "text-amber-500"
          )}>
            {formatTime(displayMinutes, displaySeconds, isOvertime)}
          </span>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] text-muted-foreground opacity-60 mt-2">
            {isOvertime ? "Overtime" : mode === "stopwatch" ? "Elapsed" : "Flow Time"}
          </span>
        </div>

        {/* Mode indicator badge */}
        {mode === "stopwatch" && (
          <div className="absolute bottom-8 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
            <span className="text-xs font-bold text-purple-400">STOPWATCH</span>
          </div>
        )}
      </div>
    </div>
  );
};

export { TimerDisplay };
