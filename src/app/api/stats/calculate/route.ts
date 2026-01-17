// ============================================================================
// STATS API - CALCULATE USER STATS
// ============================================================================
// GET /api/stats/calculate
// Calculates and returns user statistics (streak, completion rate, etc.)
// Uses standardized API wrapper with validation, rate limiting, and error handling

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { withRateLimit, withErrorHandling } from "@/lib/apiHelpers";
import { logger } from "@/lib/logger";
import { format, subDays } from "date-fns";

interface Task {
  id: string;
  completionHistory: string[];
  days: string[];
  specificDate?: string;
}

interface CalculateStatsParams {
  userId: string;
}

/**
 * GET /api/stats/calculate
 * Calculates and returns user statistics (streak, completion rate, etc.)
 */
export const GET = withErrorHandling(
  withRateLimit(
    async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId") as CalculateStatsParams["userId"];

      // Validate required fields
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required", code: "MISSING_USER_ID" },
          { status: 400 }
        );
      }

      // Get user's tasks
      const tasksSnapshot = await getDocs(collection(db, "users", userId, "tasks"));
      const tasks: Task[] = tasksSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Task));

      const stats = calculateStats(tasks);

      logger.info("Stats calculated via API", {
        action: "GET /api/stats/calculate",
        metadata: { userId }
      });

      return NextResponse.json({
        success: true,
        ...stats
      });

    },
    { maxRequests: 30, windowMs: 60000, identifier: "stats_calculate" }
  ),
  { endpoint: "/api/stats/calculate", method: "GET" }
);

/**
 * Calculate user statistics from tasks
 */
function calculateStats(tasks: Task[]) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const dayName = format(today, "EEE").toUpperCase();

  // Total completed (all time)
  const totalCompleted = tasks.reduce((acc, t) => acc + (t.completionHistory?.length || 0), 0);

  // Tasks for today
  const tasksToday = tasks.filter(t =>
    t.specificDate ? t.specificDate === todayStr : t.days?.includes(dayName)
  );
  const totalTasksToday = tasksToday.length;
  const completedTasksToday = tasksToday.filter(t =>
    t.completionHistory?.includes(todayStr)
  ).length;

  // Daily progress
  const dailyProgress = totalTasksToday > 0
    ? Math.round((completedTasksToday / totalTasksToday) * 100)
    : 0;

  // Completion rate (last 7 days)
  let scheduled = 0;
  let completed = 0;

  for (let i = 0; i < 7; i++) {
    const dateToCheck = subDays(today, i);
    const dateStr = format(dateToCheck, "yyyy-MM-dd");
    const dayStr = format(dateToCheck, "EEE").toUpperCase();

    tasks.forEach(t => {
      const isScheduled = t.specificDate
        ? t.specificDate === dateStr
        : t.days?.includes(dayStr);

      if (isScheduled) {
        scheduled++;
        if (t.completionHistory?.includes(dateStr)) completed++;
      }
    });
  }
  const completionRate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

  // Streak calculation
  let streak = 0;
  let longestStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < 365; i++) {
    const dateToCheck = subDays(today, i);
    const dateStr = format(dateToCheck, "yyyy-MM-dd");
    const dayStr = format(dateToCheck, "EEE").toUpperCase();

    // Check if any task was scheduled for this day
    const isScheduledDay = tasks.some(t =>
      t.specificDate
        ? t.specificDate === dateStr
        : t.days?.includes(dayStr)
    );

    const anyTaskDone = tasks.some(t => t.completionHistory?.includes(dateStr));

    if (isScheduledDay) {
      if (anyTaskDone) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }

      // Only count streak if this is a scheduled day
      if (i === 0) continue; // Don't break on today if not completed yet
    }

    // Count consecutive completed days
    if (anyTaskDone) {
      if (i === 0 || currentStreak > 0) {
        streak++;
      }
    } else if (isScheduledDay) {
      // Reset streak if there was a scheduled day but no completion
      if (i < 30) { // Only reset for recent days
        streak = 0;
      }
    }
  }

  return {
    totalCompleted,
    totalTasksToday,
    completedTasksToday,
    dailyProgress,
    completionRate,
    streak,
    longestStreak,
    totalTasks: tasks.length,
    calculatedAt: new Date().toISOString()
  };
}
