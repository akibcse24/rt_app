"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import { Plus, RotateCcw, Calendar as CalendarIcon, Activity, Sparkles, Clock, Trophy, Zap } from "lucide-react";
import { useConfirm } from "./ui/ConfirmDialog";

interface ProgressBarProps {
  onAddTask: () => void;
}

// Time-based greetings with emojis
const getTimeBasedGreeting = (hour: number, progress: number, userName?: string): { title: string; subtitle: string } => {
  const name = userName ? `, ${userName.split(" ")[0]}` : "";

  // Perfect day celebration
  if (progress === 100) {
    return {
      title: `Champion Mode! 🏆`,
      subtitle: `You've conquered today${name}! Time to celebrate your wins.`
    };
  }

  // Time-based greetings
  if (hour >= 5 && hour < 12) {
    return {
      title: `Rise & Shine${name}! ☀️`,
      subtitle: "Fresh start, fresh opportunities. Let's make today count!"
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      title: `Keep Pushing${name}! 💪`,
      subtitle: "Afternoon hustle mode activated. You're doing great!"
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      title: `Almost There${name}! 🌅`,
      subtitle: "Evening wind-down approaching. Finish strong!"
    };
  } else {
    return {
      title: `Night Owl${name}! 🌙`,
      subtitle: "Burning the midnight oil? Rest is productive too."
    };
  }
};

// Motivational quotes
const quotes = [
  "Small steps every day lead to big changes.",
  "Consistency beats intensity. Keep showing up.",
  "Your future self will thank you for this.",
  "Progress, not perfection.",
  "Every task completed is a victory.",
  "Build the life you want, one routine at a time.",
  "Discipline is choosing what you want most over what you want now.",
  "The secret of getting ahead is getting started."
];

const ProgressBar: React.FC<ProgressBarProps> = ({ onAddTask }) => {
  const { dailyProgress, completedTasksToday, totalTasksToday, todayDate, resetDay, tasks } = useTask();
  const { user } = useAuth();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  // Animate progress on mount/change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(dailyProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [dailyProgress]);

  // Celebration effect when reaching 100%
  useEffect(() => {
    if (dailyProgress === 100 && totalTasksToday > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [dailyProgress, totalTasksToday]);

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get current hour for time-based greeting
  const currentHour = new Date().getHours();
  const greeting = getTimeBasedGreeting(currentHour, dailyProgress, user?.displayName || undefined);

  // Find next upcoming task
  const nextTask = useMemo(() => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");
    const todayDayName = format(now, "EEE").toUpperCase();

    const upcomingTasks = tasks
      .filter(task => task.days.includes(todayDayName) && task.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return upcomingTasks[0] || null;
  }, [tasks]);

  // Calculate time until next task
  const timeUntilNext = useMemo(() => {
    if (!nextTask) return null;

    const now = new Date();
    const [hours, mins] = nextTask.startTime.split(":").map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, mins, 0, 0);

    const diffMs = taskTime.getTime() - now.getTime();
    if (diffMs <= 0) return null;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  }, [nextTask]);

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-purple-600/90 to-pink-500/90 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 lg:p-10 text-white shadow-[0_20px_50px_rgba(168,85,247,0.3)] mb-6 sm:mb-10 transition-transform duration-500 hover:scale-[1.005]">

      {/* Celebration Confetti Effect */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {["🎉", "✨", "🌟", "💫", "🏆", "⭐"][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      {/* Animated Mesh Background with Sparkles */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-0 right-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-white/10 blur-[80px] sm:blur-[100px] rounded-full -mr-10 sm:-mr-20 -mt-10 sm:-mt-20 pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-black/20 blur-[60px] sm:blur-[80px] rounded-full -ml-10 sm:-ml-20 -mb-10 sm:-mb-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 lg:gap-10">
        <div className="space-y-4 sm:space-y-6 flex-1">
          {/* Date Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md w-fit px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg">
            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90" />
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.1em] uppercase">
              {format(todayDate, "EEE, MMM d, yyyy")}
            </span>
          </div>

          {/* Dynamic Greeting */}
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none drop-shadow-lg">
              {greeting.title}
            </h2>
            <p className="text-white/80 font-medium text-sm sm:text-base lg:text-lg max-w-md drop-shadow-md">
              {greeting.subtitle}
            </p>
          </div>

          {/* Rotating Quote */}
          <div className="flex items-start gap-2 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20 max-w-md shadow-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-white italic leading-relaxed transition-opacity duration-500 font-medium">
              "{quotes[currentQuoteIndex]}"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-1 sm:pt-2">
            <Button
              onClick={onAddTask}
              className="bg-white text-purple-600 hover:bg-white/90 font-black px-5 sm:px-8 h-11 sm:h-14 rounded-xl sm:rounded-2xl border-0 shadow-2xl transition-all active:scale-95 text-sm sm:text-base hover:-translate-y-1"
            >
              <Plus className="mr-1.5 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Create Task
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Reset all tasks for today?",
                  description: "This will uncheck all completed tasks for today. This action cannot be undone.",
                  confirmText: "Reset Today",
                  cancelText: "Cancel",
                  type: "warning"
                });
                if (confirmed) resetDay();
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/30 h-11 sm:h-14 rounded-xl sm:rounded-2xl px-4 sm:px-6 backdrop-blur-md text-sm sm:text-base hover:-translate-y-1"
            >
              <RotateCcw className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Reset Today
            </Button>
          </div>
        </div>

        {/* Stats Card with Glassmorphism */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-4 sm:gap-6 lg:gap-8 bg-black/20 backdrop-blur-2xl p-5 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border border-white/10 shadow-2xl">

          {/* Animated Progress Ring */}
          <div className="relative flex items-center justify-center mx-auto sm:mx-0">
            <div className={`absolute inset-0 bg-white/20 rounded-full blur-xl transition-opacity duration-1000 ${dailyProgress > 50 ? 'opacity-100 animate-pulse-slow' : 'opacity-0'}`} />
            <svg className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 -rotate-90 transform drop-shadow-xl">
              <circle
                className="text-white/10"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="50%"
                cy="50%"
              />
              <circle
                className="text-white transition-all duration-[2000ms] ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="50%"
                cy="50%"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black drop-shadow-md">{Math.round(animatedProgress)}%</span>
            </div>
          </div>

          {/* Stats & Next Task */}
          <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Completion Stats */}
            <div className="space-y-1">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Completion</p>
              <div className="flex items-end gap-1.5 sm:gap-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black tabular-nums drop-shadow-md">{completedTasksToday}</span>
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white/40 mb-0.5 sm:mb-1">/ {totalTasksToday}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 group">
              <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full transition-all shadow-lg ${dailyProgress === 100 && totalTasksToday > 0
                ? "bg-yellow-500/30 text-yellow-300 animate-pulse border border-yellow-400/50"
                : "bg-green-500/30 text-green-300 border border-green-400/30"
                } group-hover:scale-110`}>
                {dailyProgress === 100 && totalTasksToday > 0 ? (
                  <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                ) : (
                  <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest drop-shadow-sm ${dailyProgress === 100 && totalTasksToday > 0 ? "text-yellow-300" : "text-green-300"
                }`}>
                {completedTasksToday === totalTasksToday && totalTasksToday > 0 ? "Perfect Day!" : "In Progress"}
              </span>
            </div>

            {/* Next Task Preview */}
            {nextTask && (
              <div className="flex items-center gap-2 bg-black/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10 mt-1 shadow-inner backdrop-blur-sm">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white/10 text-base sm:text-lg shrink-0 border border-white/10">
                  {nextTask.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate drop-shadow-sm">{nextTask.title}</p>
                  <div className="flex items-center gap-1 text-white/60">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-[9px] sm:text-[10px] font-semibold">
                      {nextTask.startTime} • in {timeUntilNext}
                    </span>
                  </div>
                </div>
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 shrink-0 drop-shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
      {ConfirmDialogComponent}
    </div>
  );
};

export { ProgressBar };
