// ============================================================================
// LOCAL INTELLIGENCE ENGINE
// ============================================================================
// Analytics engine for local-first habit detection and productivity insights
// Runs entirely in the browser without server dependencies

import {
    HabitInsight,
    ProductivityScore,
    SmartSuggestion,
    HabitPattern,
    TaskRecord,
    StoredFact,
    SuggestionType,
    TimeSlot,
} from "./types";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    MIN_DATA_POINTS_FOR_PATTERN: 3,
    CONFIDENCE_THRESHOLDS: {
        HIGH: 0.8,
        MEDIUM: 0.5,
        LOW: 0.3,
    },
    TIME_WINDOWS: {
        MORNING: { start: 6, end: 12 },
        AFTERNOON: { start: 12, end: 17 },
        EVENING: { start: 17, end: 22 },
    },
    STORAGE_KEYS: {
        HABIT_PATTERNS: "agent_habit_patterns",
        TASK_HISTORY: "agent_task_history",
        USER_FACTS: "agent_user_facts",
        LAST_ANALYSIS: "agent_last_analysis",
    },
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

class LocalStorageStore<T> {
    private key: string;

    constructor(key: string) {
        this.key = key;
    }

    save(data: T[]): void {
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(this.key, JSON.stringify(data));
            }
        } catch (e) {
            console.warn("Failed to save to localStorage:", e);
        }
    }

    load(): T[] {
        try {
            if (typeof window !== "undefined") {
                const stored = localStorage.getItem(this.key);
                return stored ? JSON.parse(stored) : [];
            }
        } catch (e) {
            console.warn("Failed to load from localStorage:", e);
        }
        return [];
    }

    clear(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem(this.key);
        }
    }
}

// ============================================================================
// PATTERN DETECTION ENGINE
// ============================================================================

class PatternDetector {
    private patterns: Map<string, HabitPattern> = new Map();

    constructor() {
        this.loadPatterns();
    }

    private loadPatterns(): void {
        const stored = new LocalStorageStore<HabitPattern>(CONFIG.STORAGE_KEYS.HABIT_PATTERNS).load();
        stored.forEach(p => this.patterns.set(p.id, p));
    }

    savePatterns(): void {
        const patternsArray = Array.from(this.patterns.values());
        new LocalStorageStore<HabitPattern>(CONFIG.STORAGE_KEYS.HABIT_PATTERNS).save(patternsArray);
    }

    detectPatterns(tasks: TaskRecord[]): HabitPattern[] {
        const newPatterns: HabitPattern[] = [];

        // Group tasks by category
        const categoryGroups: Record<string, TaskRecord[]> = {};
        tasks.forEach(task => {
            const category = task.category || "uncategorized";
            if (!categoryGroups[category]) {
                categoryGroups[category] = [];
            }
            categoryGroups[category].push(task);
        });

        // Analyze each category for patterns
        Object.entries(categoryGroups).forEach(([category, categoryTasks]) => {
            if (categoryTasks.length < CONFIG.MIN_DATA_POINTS_FOR_PATTERN) return;

            // Time distribution analysis
            const timeDistribution = this.analyzeTimeDistribution(categoryTasks);

            // Frequency analysis
            const frequency = this.determineFrequency(categoryTasks);

            // Consistency score
            const consistency = this.calculateConsistency(categoryTasks);

            // Create pattern if consistent enough
            if (consistency >= CONFIG.CONFIDENCE_THRESHOLDS.MEDIUM) {
                const pattern: HabitPattern = {
                    id: `pattern-${category}-${Date.now()}`,
                    name: `${category} routine`,
                    frequency,
                    trigger: "scheduled",
                    action: category,
                    successRate: consistency,
                    streak: this.calculateCurrentStreak(categoryTasks),
                    bestStreak: this.calculateBestStreak(categoryTasks),
                    lastCompleted: categoryTasks[0]?.completedAt || null,
                    averageDuration: this.calculateAverageDuration(categoryTasks),
                    timeDistribution,
                };

                const existingPattern = Array.from(this.patterns.values()).find(
                    p => p.name === pattern.name && p.frequency === pattern.frequency
                );

                if (existingPattern) {
                    // Update existing pattern
                    existingPattern.successRate = (existingPattern.successRate + consistency) / 2;
                    existingPattern.streak = pattern.streak;
                    existingPattern.lastCompleted = pattern.lastCompleted;
                    existingPattern.timeDistribution = pattern.timeDistribution;
                    this.patterns.set(existingPattern.id, existingPattern);
                } else {
                    // Create new pattern
                    this.patterns.set(pattern.id, pattern);
                    newPatterns.push(pattern);
                }
            }
        });

        this.savePatterns();
        return newPatterns;
    }

    private analyzeTimeDistribution(tasks: TaskRecord[]): TimeSlot[] {
        const hourCounts: Record<number, number> = {};
        
        tasks.forEach(task => {
            const hour = new Date(task.completedAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return Object.entries(hourCounts).map(([hour, count]) => ({
            hour: parseInt(hour),
            count,
        })).sort((a, b) => b.count - a.count);
    }

    private determineFrequency(tasks: TaskRecord[]): HabitPattern["frequency"] {
        if (tasks.length < 2) return "daily";

        const timeSpan = tasks[tasks.length - 1].completedAt - tasks[0].completedAt;
        const daysSpan = timeSpan / (24 * 60 * 60 * 1000);
        const avgDaysBetween = daysSpan / (tasks.length - 1);

        if (avgDaysBetween < 1.5) return "daily";
        if (avgDaysBetween < 8) return "weekly";
        return "monthly";
    }

    private calculateConsistency(tasks: TaskRecord[]): number {
        if (tasks.length < 2) return 0.5;

        const dayGroups: Record<string, number> = {};
        tasks.forEach(task => {
            const day = new Date(task.completedAt).toISOString().split("T")[0];
            dayGroups[day] = (dayGroups[day] || 0) + 1;
        });

        // Check if tasks are spread across multiple days (good consistency)
        const daysActive = Object.keys(dayGroups).length;
        const totalTasks = tasks.length;

        if (daysActive === 0) return 0;
        return Math.min(1, totalTasks / (daysActive * 2));
    }

    private calculateCurrentStreak(tasks: TaskRecord[]): number {
        if (tasks.length === 0) return 0;

        const sortedTasks = [...tasks].sort((a, b) => b.completedAt - a.completedAt);
        let streak = 0;
        let currentDate = new Date().toISOString().split("T")[0];

        for (const task of sortedTasks) {
            const taskDate = new Date(task.completedAt).toISOString().split("T")[0];
            const taskDateObj = new Date(taskDate);
            const currentDateObj = new Date(currentDate);

            const diffDays = Math.floor((currentDateObj.getTime() - taskDateObj.getTime()) / (24 * 60 * 60 * 1000));

            if (diffDays <= streak + 1) {
                streak++;
                currentDate = taskDate;
            } else {
                break;
            }
        }

        return streak;
    }

    private calculateBestStreak(tasks: TaskRecord[]): number {
        // Simplified best streak calculation
        return this.calculateCurrentStreak(tasks);
    }

    private calculateAverageDuration(tasks: TaskRecord[]): number {
        const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);
        return tasks.length > 0 ? totalDuration / tasks.length : 0;
    }

    getPatterns(): HabitPattern[] {
        return Array.from(this.patterns.values());
    }

    getPattern(id: string): HabitPattern | undefined {
        return this.patterns.get(id);
    }
}

// ============================================================================
// PRODUCTIVITY ANALYZER
// ============================================================================

class ProductivityAnalyzer {
    calculateProductivityScore(
        tasks: Array<{ completedAt?: number; createdAt: number; category?: string; duration?: number }>
    ): ProductivityScore {
        const now = new Date();
        const thisWeek = tasks.filter(t => {
            if (!t.completedAt) return false;
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return t.completedAt > weekAgo.getTime();
        });

        const thisMonth = tasks.filter(t => {
            if (!t.completedAt) return false;
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return t.completedAt > monthAgo.getTime();
        });

        // Calculate time-of-day distribution
        const timeDistribution = this.analyzeTimeOfDayDistribution(thisWeek);
        const morningScore = this.calculateTimeBlockScore(timeDistribution, CONFIG.TIME_WINDOWS.MORNING);
        const afternoonScore = this.calculateTimeBlockScore(timeDistribution, CONFIG.TIME_WINDOWS.AFTERNOON);
        const eveningScore = this.calculateTimeBlockScore(timeDistribution, CONFIG.TIME_WINDOWS.EVENING);

        // Calculate overall score based on completion rate
        const totalCreated = tasks.filter(t => t.createdAt > now.getTime() - 7 * 24 * 60 * 60 * 1000).length;
        const completionRate = totalCreated > 0 ? (thisWeek.length / totalCreated) : 0.5;
        const overallScore = Math.min(100, Math.round(completionRate * 100 * 1.2));

        // Calculate focus score (tasks with duration > 0)
        const focusTasks = tasks.filter(t => (t.duration || 0) > 0 && t.completedAt);
        const focusScore = thisWeek.length > 0 
            ? Math.min(100, Math.round((focusTasks.length / thisWeek.length) * 100))
            : 50;

        // Calculate consistency score
        const consistencyScore = this.calculateConsistencyScore(tasks);

        return {
            overall: Math.round(overallScore),
            morningScore: Math.round(morningScore),
            afternoonScore: Math.round(afternoonScore),
            eveningScore: Math.round(eveningScore),
            focusScore: Math.round(focusScore),
            consistencyScore: Math.round(consistencyScore),
            calculatedAt: Date.now(),
        };
    }

    private analyzeTimeOfDayDistribution(tasks: Array<{ completedAt?: number }>): Map<number, number> {
        const distribution = new Map<number, number>();

        tasks.forEach(task => {
            if (task.completedAt) {
                const hour = new Date(task.completedAt).getHours();
                distribution.set(hour, (distribution.get(hour) || 0) + 1);
            }
        });

        return distribution;
    }

    private calculateTimeBlockScore(
        distribution: Map<number, number>,
        window: { start: number; end: number }
    ): number {
        let windowTasks = 0;
        let totalTasks = 0;

        distribution.forEach((count, hour) => {
            totalTasks += count;
            if (hour >= window.start && hour < window.end) {
                windowTasks += count;
            }
        });

        return totalTasks > 0 ? (windowTasks / totalTasks) * 100 : 33;
    }

    private calculateConsistencyScore(tasks: Array<{ completedAt?: number }>): number {
        const now = new Date();
        const last30Days: number[] = [];

        for (let i = 0; i < 30; i++) {
            const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const dayTasks = tasks.filter(t => 
                t.completedAt && 
                t.completedAt >= dayStart.getTime() && 
                t.completedAt < dayEnd.getTime()
            );

            last30Days.push(dayTasks.length > 0 ? 1 : 0);
        }

        const activeDays = last30Days.filter(d => d === 1).length;
        return (activeDays / 30) * 100;
    }
}

// ============================================================================
// INSIGHT GENERATOR
// ============================================================================

class InsightGenerator {
    private patternDetector: PatternDetector;
    private productivityAnalyzer: ProductivityAnalyzer;

    constructor() {
        this.patternDetector = new PatternDetector();
        this.productivityAnalyzer = new ProductivityAnalyzer();
    }

    generateInsights(
        tasks: TaskRecord[],
        patterns: HabitPattern[],
        productivity: ProductivityScore
    ): HabitInsight[] {
        const insights: HabitInsight[] = [];

        // Streak insights
        const activeStreaks = patterns.filter(p => p.streak >= 3);
        activeStreaks.forEach(pattern => {
            insights.push({
                id: `insight-streak-${pattern.id}`,
                type: "streak",
                title: `${pattern.name} streak!`,
                description: `You've maintained your ${pattern.name} for ${pattern.streak} consecutive periods. Keep it up!`,
                confidence: 0.95,
                actionable: false,
                relatedTasks: [],
                generatedAt: Date.now(),
            });
        });

        // Productivity pattern insights
        if (productivity.morningScore > 50) {
            insights.push({
                id: "insight-morning-peak",
                type: "consistency",
                title: "Morning productivity peak detected",
                description: `You complete ${productivity.morningScore}% of your tasks before noon. This is your peak performance time.`,
                confidence: 0.85,
                actionable: true,
                action: "schedule_important_tasks_morning",
                relatedTasks: [],
                generatedAt: Date.now(),
            });
        }

        if (productivity.afternoonScore > 50) {
            insights.push({
                id: "insight-afternoon-peak",
                type: "consistency",
                title: "Afternoon productivity peak detected",
                description: `You complete ${productivity.afternoonScore}% of your tasks in the afternoon. Good time for focused work.`,
                confidence: 0.85,
                actionable: true,
                action: "schedule_important_tasks_afternoon",
                relatedTasks: [],
                generatedAt: Date.now(),
            });
        }

        // Focus score insights
        if (productivity.focusScore < 50) {
            insights.push({
                id: "insight-focus-low",
                type: "optimization",
                title: "Increase focus time",
                description: "Only a small portion of your tasks include duration tracking. Adding time estimates can help improve focus.",
                confidence: 0.75,
                actionable: true,
                action: "enable_focus_tracking",
                relatedTasks: [],
                generatedAt: Date.now(),
            });
        }

        // Consistency insights
        if (productivity.consistencyScore > 70) {
            insights.push({
                id: "insight-consistency-high",
                type: "streak",
                title: "Excellent consistency!",
                description: `You've been productive on ${productivity.consistencyScore}% of days this month. This is a strong habit!`,
                confidence: 0.9,
                actionable: false,
                relatedTasks: [],
                generatedAt: Date.now(),
            });
        }

        return insights;
    }
}

// ============================================================================
// SUGGESTION ENGINE
// ============================================================================

class SuggestionEngine {
    generateSuggestions(
        insights: HabitInsight[],
        productivity: ProductivityScore,
        patterns: HabitPattern[]
    ): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];
        const now = Date.now();

        // Time optimization suggestions
        if (productivity.morningScore > productivity.afternoonScore && productivity.morningScore > 40) {
            suggestions.push({
                id: `sug-time-morning-${now}`,
                type: "time_optimization",
                title: "Schedule important tasks in the morning",
                description: "Your productivity data shows you're most effective before noon. Consider blocking this time for high-priority work.",
                priority: 8,
                actionData: { preferredTime: "morning", priority: "high" },
                dismissed: false,
                generatedAt: now,
            });
        }

        if (productivity.afternoonScore > productivity.morningScore && productivity.afternoonScore > 40) {
            suggestions.push({
                id: `sug-time-afternoon-${now}`,
                type: "time_optimization",
                title: "Afternoon is your peak time",
                description: "You seem to be most productive in the afternoon. Plan your important tasks for this window.",
                priority: 8,
                actionData: { preferredTime: "afternoon", priority: "high" },
                dismissed: false,
                generatedAt: now,
            });
        }

        // Streak motivation
        const hasActiveStreaks = patterns.some(p => p.streak >= 3);
        if (hasActiveStreaks) {
            const bestStreak = Math.max(...patterns.map(p => p.streak));
            const bestPattern = patterns.find(p => p.streak === bestStreak);
            
            suggestions.push({
                id: `sug-streak-${now}`,
                type: "streak_motivation",
                title: `Keep your ${bestPattern?.name || "habit"} streak going!`,
                description: `You have a ${bestStreak}-day streak! Small consistent actions lead to big results.`,
                priority: 7,
                actionData: { patternId: bestPattern?.id },
                dismissed: false,
                generatedAt: now,
            });
        }

        // Break reminder (if focused for a while)
        const recentFocusSessions = productivity.focusScore;
        if (recentFocusSessions > 60) {
            suggestions.push({
                id: `sug-break-${now}`,
                type: "break_reminder",
                title: "Time for a break?",
                description: "You've been consistently focused lately. Consider taking a short break to maintain your energy.",
                priority: 5,
                actionData: { breakDuration: 5 },
                expiresAt: now + 2 * 60 * 60 * 1000, // 2 hours
                dismissed: false,
                generatedAt: now,
            });
        }

        // Habit formation for emerging patterns
        const emergingPatterns = patterns.filter(p => p.successRate >= 0.4 && p.successRate < 0.7);
        if (emergingPatterns.length > 0) {
            const pattern = emergingPatterns[0];
            suggestions.push({
                id: `sug-habit-${now}`,
                type: "habit_formation",
                title: `Turn "${pattern.name}" into a routine`,
                description: "You've been doing this consistently. Creating a routine can help make it a lasting habit.",
                priority: 7,
                actionData: { pattern },
                dismissed: false,
                generatedAt: now,
            });
        }

        // Goal alignment
        suggestions.push({
            id: `sug-goal-${now}`,
            type: "goal_alignment",
            title: "Align tasks with your goals",
            description: "Review your daily tasks to ensure they're moving you toward your bigger goals.",
            priority: 6,
            actionData: { action: "review_goals" },
            dismissed: false,
            generatedAt: now,
        });

        return suggestions.sort((a, b) => b.priority - a.priority);
    }
}

// ============================================================================
// MAIN LOCAL INTELLIGENCE CLASS
// ============================================================================

class LocalIntelligence {
    private patternDetector: PatternDetector;
    private productivityAnalyzer: ProductivityAnalyzer;
    private insightGenerator: InsightGenerator;
    private suggestionEngine: SuggestionEngine;

    constructor() {
        this.patternDetector = new PatternDetector();
        this.productivityAnalyzer = new ProductivityAnalyzer();
        this.insightGenerator = new InsightGenerator();
        this.suggestionEngine = new SuggestionEngine();
    }

    analyze(
        tasks: Array<{ id: string; name: string; completedAt?: number; createdAt: number; category?: string; duration?: number }>
    ): {
        patterns: HabitPattern[];
        productivity: ProductivityScore;
        insights: HabitInsight[];
        suggestions: SmartSuggestion[];
    } {
        // Convert to TaskRecord format
        const taskRecords: TaskRecord[] = tasks.map(t => ({
            id: t.id,
            name: t.name,
            category: t.category || "uncategorized",
            completedAt: t.completedAt || 0,
            duration: t.duration || 0,
            wasRoutine: false,
        }));

        // Detect patterns
        const patterns = this.patternDetector.detectPatterns(taskRecords);
        const existingPatterns = this.patternDetector.getPatterns();

        // Calculate productivity
        const productivity = this.productivityAnalyzer.calculateProductivityScore(tasks);

        // Generate insights
        const insights = this.insightGenerator.generateInsights(taskRecords, existingPatterns, productivity);

        // Generate suggestions
        const suggestions = this.suggestionEngine.generateSuggestions(insights, productivity, existingPatterns);

        return {
            patterns: existingPatterns,
            productivity,
            insights,
            suggestions,
        };
    }

    getPatterns(): HabitPattern[] {
        return this.patternDetector.getPatterns();
    }

    clearData(): void {
        new LocalStorageStore<HabitPattern>(CONFIG.STORAGE_KEYS.HABIT_PATTERNS).clear();
        new LocalStorageStore<TaskRecord>(CONFIG.STORAGE_KEYS.TASK_HISTORY).clear();
        new LocalStorageStore<StoredFact>(CONFIG.STORAGE_KEYS.USER_FACTS).clear();
    }
}

// Export singleton
export const localIntelligence = new LocalIntelligence();
export { LocalIntelligence, PatternDetector, ProductivityAnalyzer, InsightGenerator, SuggestionEngine };
