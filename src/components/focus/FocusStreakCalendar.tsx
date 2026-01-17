"use client";

import React, { useMemo } from "react";
import { Calendar, Trophy, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface FocusStreakCalendarProps {
  weeklyData: { day: string; minutes: number }[];
  currentStreak: number;
  longestStreak: number;
  totalFocusDays: number;
}

export const FocusStreakCalendar: React.FC<FocusStreakCalendarProps> = ({
  weeklyData,
  currentStreak,
  longestStreak,
  totalFocusDays,
}) => {
  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 60);

  // Calculate current day index
  const getCurrentDayIndex = () => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  };

  const currentDayIndex = getCurrentDayIndex();

  // Determine streak level for visualization
  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: "legendary", color: "text-yellow-400", icon: "👑" };
    if (streak >= 14) return { level: "epic", color: "text-purple-400", icon: "🏆" };
    if (streak >= 7) return { level: "amazing", color: "text-orange-400", icon: "🔥" };
    if (streak >= 3) return { level: "great", color: "text-emerald-400", icon: "⭐" };
    if (streak >= 1) return { level: "good", color: "text-blue-400", icon: "💪" };
    return { level: "none", color: "text-muted-foreground", icon: "💤" };
  };

  const streakInfo = getStreakLevel(currentStreak);

  return (
    <div className="rounded-3xl bg-card border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Focus Streak</h3>
          <p className="text-xs text-muted-foreground">Consistency builds habits</p>
        </div>
      </div>

      {/* Current Streak Display */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-6 text-center">
        <div className="relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2"
          >
            {currentStreak}
          </motion.div>
          <p className="text-sm font-bold text-foreground uppercase tracking-wider">
            Day Streak 🔥
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {streakInfo.level === "none"
              ? "Start your streak today!"
              : `${streakInfo.level} streak! Keep it up!`
            }
          </p>
        </div>

        {/* Animated background glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
      </div>

      {/* Weekly Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            This Week
          </h4>
          <span className="text-[10px] text-muted-foreground">
            {totalFocusDays} total days
          </span>
        </div>

        <div className="flex items-end justify-between gap-1 sm:gap-2 h-20">
          {weeklyData.map((day, i) => {
            const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
            const isToday = i === currentDayIndex;
            const hasFocus = day.minutes > 0;

            return (
              <div
                key={day.day}
                className="flex flex-col items-center flex-1 gap-2 group relative"
              >
                <div className="relative w-full flex justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(height, 4) }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`
                      w-full max-w-[32px] rounded-lg transition-all duration-300
                      ${isToday
                        ? "bg-gradient-to-t from-orange-500 to-red-500"
                        : hasFocus
                          ? "bg-white/10 hover:bg-white/20"
                          : "bg-white/5"
                      }
                    `}
                  />

                  {/* Tooltip */}
                  {day.minutes > 0 && (
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        {day.minutes}m
                      </div>
                    </div>
                  )}
                </div>

                <span className={`
                  text-[10px] font-medium transition-colors
                  ${isToday ? "text-orange-400" : "text-muted-foreground"}
                `}>
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-3 w-3 text-yellow-400" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Longest
            </span>
          </div>
          <p className="text-lg font-black text-foreground">
            {longestStreak} <span className="text-xs font-medium text-muted-foreground">days</span>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-3 w-3 text-blue-400" />
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Focus Days
            </span>
          </div>
          <p className="text-lg font-black text-foreground">
            {totalFocusDays} <span className="text-xs font-medium text-muted-foreground">days</span>
          </p>
        </div>
      </div>
    </div>
  );
};
