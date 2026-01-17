// ============================================================================
// FOCUS SESSION FIRESTORE UTILITIES
// ============================================================================
// Handles all Firestore operations for focus sessions including CRUD,
// analytics, and real-time stats calculations.

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    setDoc,
    Timestamp,
    serverTimestamp,
    limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { withRetry, handleFirestoreError, showSuccess } from "./firestoreUtils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FocusSession {
    id: string;
    userId: string;
    startTime: Timestamp;
    endTime?: Timestamp;
    duration: number; // minutes
    sessionType: "focus" | "shortBreak" | "longBreak";
    preset: "classic" | "deepWork" | "sprint" | "custom";
    linkedTaskId?: string;
    linkedTaskTitle?: string;
    completed: boolean;
    abandoned: boolean;
    ambient?: string;
    notes?: string;
    distractions?: DistractionData;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DistractionData {
    totalBlurTime: number; // seconds
    blurCount: number;
    focusPercentage: number;
    isPerfectFocus: boolean;
}

export interface FocusPreset {
    id: "classic" | "deepWork" | "sprint" | "custom";
    name: string;
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    description: string;
}

export interface DailyFocusStats {
    date: string;
    totalMinutes: number;
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    perfectFocusSessions: number;
    averageFocusPercentage: number;
}

export interface WeeklyFocusStats {
    weekStart: string;
    weekEnd: string;
    dailyStats: DailyFocusStats[];
    totalMinutes: number;
    totalSessions: number;
    averageMinutesPerDay: number;
    completionRate: number;
    bestDay: { date: string; minutes: number } | null;
}

export interface EnergyPattern {
    hour: number;
    averageFocusPercentage: number;
    sessionCount: number;
    totalMinutes: number;
    energyLevel: "high" | "medium" | "low";
}

export interface FocusAchievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: Timestamp;
    category: "time" | "session" | "quality" | "special" | "streak";
}

export interface FocusStreak {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    totalFocusDays: number;
    lastFocusDate: string | null;
    updatedAt: Timestamp;
}

// ============================================================================
// FOCUS PRESETS
// ============================================================================

export const FOCUS_PRESETS: FocusPreset[] = [
    {
        id: "classic",
        name: "Classic Pomodoro",
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        description: "Traditional 25/5/15 rhythm for balanced productivity",
    },
    {
        id: "deepWork",
        name: "Deep Work",
        focusMinutes: 50,
        shortBreakMinutes: 10,
        longBreakMinutes: 30,
        description: "Extended focus blocks for complex tasks",
    },
    {
        id: "sprint",
        name: "Sprint",
        focusMinutes: 15,
        shortBreakMinutes: 3,
        longBreakMinutes: 10,
        description: "Rapid iteration for quick wins",
    },
    {
        id: "custom",
        name: "Custom",
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        description: "Define your own rhythm",
    },
];

// ============================================================================
// SESSION CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new focus session in Firestore
 */
export async function createFocusSession(
    userId: string,
    data: {
        sessionType: "focus" | "shortBreak" | "longBreak";
        duration: number;
        preset: "classic" | "deepWork" | "sprint" | "custom";
        linkedTaskId?: string;
        linkedTaskTitle?: string;
    }
): Promise<string> {
    try {
        const sessionData = {
            userId,
            startTime: serverTimestamp(),
            duration: data.duration,
            sessionType: data.sessionType,
            preset: data.preset,
            linkedTaskId: data.linkedTaskId || null,
            linkedTaskTitle: data.linkedTaskTitle || null,
            completed: false,
            abandoned: false,
            ambient: null,
            notes: null,
            distractions: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await withRetry(
            () => addDoc(collection(db, `users/${userId}/focusSessions`), sessionData),
            { operationName: "Create focus session", silent: true }
        );

        return docRef.id;
    } catch (error) {
        handleFirestoreError(error, "Failed to start focus session");
        throw error;
    }
}

/**
 * Updates an existing focus session
 */
export async function updateFocusSession(
    userId: string,
    sessionId: string,
    updates: Partial<{
        completed: boolean;
        abandoned: boolean;
        ambient: string;
        notes: string;
        distractions: DistractionData;
        endTime: Timestamp;
    }>
): Promise<void> {
    try {
        const sessionRef = doc(db, `users/${userId}/focusSessions`, sessionId);

        await withRetry(
            () =>
                updateDoc(sessionRef, {
                    ...updates,
                    updatedAt: serverTimestamp(),
                }),
            { operationName: "Update focus session", silent: true }
        );
    } catch (error) {
        handleFirestoreError(error, "Failed to update focus session");
        throw error;
    }
}

/**
 * Completes a focus session with final stats
 */
export async function completeFocusSession(
    userId: string,
    sessionId: string,
    data: {
        completed: boolean;
        distractions?: DistractionData;
        notes?: string;
    }
): Promise<void> {
    try {
        await updateFocusSession(userId, sessionId, {
            completed: data.completed,
            abandoned: !data.completed,
            distractions: data.distractions || undefined,
            notes: data.notes || undefined,
            endTime: Timestamp.now(),
        });

        if (data.completed) {
            showSuccess("Focus session complete! 🎉");
        }
    } catch (error) {
        handleFirestoreError(error, "Failed to complete session");
        throw error;
    }
}

/**
 * Gets the last incomplete session (for resume functionality)
 */
export async function getIncompleteSession(
    userId: string
): Promise<FocusSession | null> {
    try {
        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("completed", "==", false),
            where("abandoned", "==", false),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as FocusSession;
    } catch (error) {
        console.error("Failed to get incomplete session:", error);
        return null;
    }
}

// ============================================================================
// ANALYTICS & STATS
// ============================================================================

/**
 * Gets today's focus stats
 */
export async function getTodayFocusStats(
    userId: string
): Promise<{ minutes: number; sessions: number }> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true),
            where("createdAt", ">=", Timestamp.fromDate(today)),
            where("createdAt", "<", Timestamp.fromDate(tomorrow))
        );

        const snapshot = await getDocs(q);

        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);
        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

        return {
            minutes: totalMinutes,
            sessions: sessions.length,
        };
    } catch (error) {
        console.error("Failed to get today's stats:", error);
        return { minutes: 0, sessions: 0 };
    }
}

/**
 * Gets focus stats for the last 7 days
 */
export async function getWeeklyFocusStats(
    userId: string
): Promise<WeeklyFocusStats> {
    try {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("createdAt", ">=", Timestamp.fromDate(startDate)),
            where("createdAt", "<=", Timestamp.fromDate(endDate))
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        // Group by day
        const dailyStatsMap = new Map<string, DailyFocusStats>();

        // Initialize all 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toDateString();

            dailyStatsMap.set(dateStr, {
                date: dateStr,
                totalMinutes: 0,
                totalSessions: 0,
                completedSessions: 0,
                abandonedSessions: 0,
                perfectFocusSessions: 0,
                averageFocusPercentage: 0,
            });
        }

        // Aggregate sessions
        sessions.forEach((session) => {
            const dateStr = session.createdAt.toDate().toDateString();
            const stats = dailyStatsMap.get(dateStr);

            if (stats) {
                stats.totalSessions++;
                if (session.completed) {
                    stats.totalMinutes += session.duration;
                    stats.completedSessions++;
                    if (session.distractions?.isPerfectFocus) {
                        stats.perfectFocusSessions++;
                    }
                }
                if (session.abandoned) {
                    stats.abandonedSessions++;
                }
            }
        });

        // Calculate averages
        dailyStatsMap.forEach((stats) => {
            const completedSessions = sessions.filter(
                (s) =>
                    s.createdAt.toDate().toDateString() === stats.date && s.completed
            );

            if (completedSessions.length > 0) {
                const avgFocus =
                    completedSessions.reduce(
                        (sum, s) => sum + (s.distractions?.focusPercentage || 100),
                        0
                    ) / completedSessions.length;
                stats.averageFocusPercentage = Math.round(avgFocus);
            }
        });

        const dailyStats = Array.from(dailyStatsMap.values());
        const totalMinutes = dailyStats.reduce((sum, d) => sum + d.totalMinutes, 0);
        const totalSessions = sessions.filter((s) => s.completed).length;
        const totalAttempts = sessions.length;
        const completionRate =
            totalAttempts > 0 ? Math.round((totalSessions / totalAttempts) * 100) : 0;

        const bestDay = dailyStats.reduce(
            (best, day) => {
                if (day.totalMinutes > (best?.minutes || 0)) {
                    return { date: day.date, minutes: day.totalMinutes };
                }
                return best;
            },
            null as { date: string; minutes: number } | null
        );

        return {
            weekStart: startDate.toDateString(),
            weekEnd: endDate.toDateString(),
            dailyStats,
            totalMinutes,
            totalSessions,
            averageMinutesPerDay: Math.round(totalMinutes / 7),
            completionRate,
            bestDay,
        };
    } catch (error) {
        console.error("Failed to get weekly stats:", error);
        return {
            weekStart: "",
            weekEnd: "",
            dailyStats: [],
            totalMinutes: 0,
            totalSessions: 0,
            averageMinutesPerDay: 0,
            completionRate: 0,
            bestDay: null,
        };
    }
}

/**
 * Analyzes energy patterns by hour of day
 */
export async function getEnergyPatterns(
    userId: string,
    days: number = 30
): Promise<EnergyPattern[]> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true),
            where("createdAt", ">=", Timestamp.fromDate(startDate))
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        // Group by hour
        const hourlyData = new Map<number, {
            totalFocus: number;
            count: number;
            minutes: number;
        }>();

        // Initialize all 24 hours
        for (let i = 0; i < 24; i++) {
            hourlyData.set(i, { totalFocus: 0, count: 0, minutes: 0 });
        }

        // Aggregate by hour
        sessions.forEach((session) => {
            const hour = session.createdAt.toDate().getHours();
            const data = hourlyData.get(hour)!;

            data.count++;
            data.minutes += session.duration;
            data.totalFocus += session.distractions?.focusPercentage || 100;
        });

        // Convert to energy patterns
        const patterns: EnergyPattern[] = [];
        hourlyData.forEach((data, hour) => {
            const avgFocus = data.count > 0 ? data.totalFocus / data.count : 0;

            let energyLevel: "high" | "medium" | "low";
            if (avgFocus >= 90) energyLevel = "high";
            else if (avgFocus >= 75) energyLevel = "medium";
            else energyLevel = "low";

            patterns.push({
                hour,
                averageFocusPercentage: Math.round(avgFocus),
                sessionCount: data.count,
                totalMinutes: data.minutes,
                energyLevel,
            });
        });

        return patterns.sort((a, b) => a.hour - b.hour);
    } catch (error) {
        console.error("Failed to get energy patterns:", error);
        return [];
    }
}

/**
 * Gets total focus minutes (for achievements)
 */
export async function getTotalFocusMinutes(userId: string): Promise<number> {
    try {
        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true)
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        return sessions.reduce((sum, s) => sum + s.duration, 0);
    } catch (error) {
        console.error("Failed to get total focus minutes:", error);
        return 0;
    }
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

/**
 * Saves a new achievement for the user
 */
export async function saveFocusAchievement(
    userId: string,
    achievement: Omit<FocusAchievement, "earnedAt">
): Promise<void> {
    try {
        const achievementData = {
            ...achievement,
            earnedAt: serverTimestamp(),
        };

        await withRetry(
            () => addDoc(collection(db, `users/${userId}/achievements`), achievementData),
            { operationName: "Save achievement", silent: true }
        );
    } catch (error) {
        handleFirestoreError(error, "Failed to save achievement");
        throw error;
    }
}

/**
 * Gets all user achievements
 */
export async function getUserAchievements(userId: string): Promise<FocusAchievement[]> {
    try {
        const achievementsRef = collection(db, `users/${userId}/achievements`);
        const q = query(achievementsRef, orderBy("earnedAt", "desc"));

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => doc.data() as FocusAchievement);
    } catch (error) {
        console.error("Failed to get achievements:", error);
        return [];
    }
}

/**
 * Checks if user has a specific achievement
 */
export async function hasAchievement(
    userId: string,
    achievementId: string
): Promise<boolean> {
    try {
        const achievementsRef = collection(db, `users/${userId}/achievements`);
        const q = query(achievementsRef, where("id", "==", achievementId), limit(1));

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Failed to check achievement:", error);
        return false;
    }
}

// ============================================================================
// STREAKS
// ============================================================================

/**
 * Gets user's focus streak data
 */
export async function getFocusStreak(userId: string): Promise<FocusStreak> {
    try {
        const streakRef = doc(db, `users/${userId}/streaks`, "focusStreak");
        const streakDoc = await getDoc(streakRef);

        if (streakDoc.exists()) {
            return streakDoc.data() as FocusStreak;
        }

        // Calculate streak from sessions
        const stats = await calculateStreakFromSessions(userId);
        return {
            userId,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
            totalFocusDays: stats.totalDays,
            lastFocusDate: stats.lastDate,
            updatedAt: Timestamp.now(),
        };
    } catch (error) {
        console.error("Failed to get streak:", error);
        return {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            totalFocusDays: 0,
            lastFocusDate: null,
            updatedAt: Timestamp.now(),
        };
    }
}

/**
 * Updates focus streak after a session
 */
export async function updateFocusStreak(userId: string): Promise<void> {
    try {
        const today = new Date().toDateString();
        const streakRef = doc(db, `users/${userId}/streaks`, "focusStreak");
        
        let currentStreak = 0;
        let longestStreak = 0;
        let totalFocusDays = 0;
        let lastFocusDate: string | null = null;

        const streakDoc = await getDoc(streakRef);
        if (streakDoc.exists()) {
            const data = streakDoc.data() as FocusStreak;
            currentStreak = data.currentStreak;
            longestStreak = data.longestStreak;
            totalFocusDays = data.totalFocusDays;
            lastFocusDate = data.lastFocusDate;
        }

        // Check if we need to update the streak
        if (lastFocusDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            if (lastFocusDate === yesterdayStr) {
                // Consecutive day - increment streak
                currentStreak += 1;
            } else if (lastFocusDate !== today) {
                // Streak broken - reset
                currentStreak = 1;
            }

            // Update longest streak
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }

            // Update total days if new day
            if (lastFocusDate !== today) {
                totalFocusDays += 1;
            }

            lastFocusDate = today;

            await withRetry(
                () => setDoc(streakRef, {
                    userId,
                    currentStreak,
                    longestStreak,
                    totalFocusDays,
                    lastFocusDate,
                    updatedAt: serverTimestamp(),
                }),
                { operationName: "Update streak", silent: true }
            );
        }
    } catch (error) {
        console.error("Failed to update streak:", error);
    }
}

/**
 * Calculates streak data from sessions (fallback)
 */
async function calculateStreakFromSessions(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    lastDate: string | null;
}> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // Last 90 days

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true),
            where("createdAt", ">=", Timestamp.fromDate(startDate)),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        // Get unique focus days
        const focusDays = new Set<string>();
        sessions.forEach((session) => {
            focusDays.add(session.createdAt.toDate().toDateString());
        });

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (focusDays.has(today)) {
            currentStreak = 1;
            let checkDate = new Date();
            while (true) {
                checkDate.setDate(checkDate.getDate() - 1);
                if (focusDays.has(checkDate.toDateString())) {
                    currentStreak += 1;
                } else {
                    break;
                }
            }
        } else if (focusDays.has(yesterdayStr)) {
            currentStreak = 1;
            let checkDate = new Date(yesterday);
            while (true) {
                checkDate.setDate(checkDate.getDate() - 1);
                if (focusDays.has(checkDate.toDateString())) {
                    currentStreak += 1;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        const sortedDays = Array.from(focusDays).sort((a, b) => 
            new Date(b).getTime() - new Date(a).getTime()
        );
        
        let longestStreak = 0;
        let tempStreak = 0;
        let previousDate: Date | null = null;

        for (const dayStr of sortedDays) {
            const date = new Date(dayStr);
            if (previousDate) {
                const diffDays = Math.floor((previousDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak += 1;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            previousDate = date;
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Get last focus date
        const lastDate = sortedDays.length > 0 ? sortedDays[0] : null;

        return {
            currentStreak,
            longestStreak,
            totalDays: focusDays.size,
            lastDate,
        };
    } catch (error) {
        console.error("Failed to calculate streak:", error);
        return {
            currentStreak: 0,
            longestStreak: 0,
            totalDays: 0,
            lastDate: null,
        };
    }
}

/**
 * Gets distraction patterns for analytics
 */
export async function getDistractionPatterns(
    userId: string,
    days: number = 30
): Promise<{ reasons: Record<string, number>; totalDistractions: number }> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("completed", "==", true),
            where("createdAt", ">=", Timestamp.fromDate(startDate))
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        const reasons: Record<string, number> = {};
        let totalDistractions = 0;

        // This would require additional tracking data - placeholder for now
        // In a full implementation, you'd track distraction reasons separately
        
        return { reasons, totalDistractions };
    } catch (error) {
        console.error("Failed to get distraction patterns:", error);
        return { reasons: {}, totalDistractions: 0 };
    }
}
