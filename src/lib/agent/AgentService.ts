// ============================================================================
// AGENT SERVICE
// ============================================================================
// Core "Brain" class for the agentic system
// Handles perception processing, reasoning, and action execution
// Local-first architecture with IndexedDB persistence

import { useAgentContext } from "@/context/AgentContext";
import {
    AgentState,
    AgentAction,
    AgentStatus,
    IntentType,
    ParsedInput,
    SmartSuggestion,
    HabitInsight,
    ProductivityScore,
    ReasoningTrace,
    ReasoningStrategy,
    ActionType,
    ActionResult,
    ToolDefinition,
    Entity,
    EntityType,
    StoredFact,
    HabitPattern,
} from "./types";

// ============================================================================
// LOCAL INTELLIGENCE (Inline implementation for dependency resolution)
// ============================================================================

class LocalIntelligenceEngine {
    private habitPatterns: Map<string, HabitPattern> = new Map();
    private taskHistory: Array<{ id: string; name: string; completedAt: number; category: string }> = [];
    private userFacts: StoredFact[] = [];

    async analyzeHabits(tasks: Array<{ id: string; name: string; completedAt?: number; category?: string }>): Promise<HabitInsight[]> {
        const insights: HabitInsight[] = [];

        // Analyze completion patterns
        const categoryCompletion: Record<string, number[]> = {};
        tasks.forEach(task => {
            if (task.completedAt && task.category) {
                if (!categoryCompletion[task.category]) {
                    categoryCompletion[task.category] = [];
                }
                const hour = new Date(task.completedAt).getHours();
                categoryCompletion[task.category].push(hour);
            }
        });

        // Detect time patterns for each category
        Object.entries(categoryCompletion).forEach(([category, hours]) => {
            if (hours.length >= 3) {
                const averageHour = hours.reduce((a, b) => a + b, 0) / hours.length;
                const variance = hours.reduce((sum, h) => sum + Math.pow(h - averageHour, 2), 0) / hours.length;
                
                if (variance < 2) {
                    insights.push({
                        id: `habit-${category}-${Date.now()}`,
                        type: "consistency",
                        title: `${category} is part of your routine`,
                        description: `You typically complete ${category} tasks around ${Math.round(averageHour)}:00. This consistency helps build lasting habits.`,
                        confidence: 0.85,
                        actionable: false,
                        relatedTasks: tasks.filter(t => t.category === category).map(t => t.id),
                        generatedAt: Date.now(),
                    });
                }
            }
        });

        return insights;
    }

    async calculateProductivityScore(
        tasks: Array<{ completedAt?: number; createdAt: number; category?: string }>
    ): Promise<ProductivityScore> {
        const now = new Date();
        const thisWeek: typeof tasks = [];
        const thisMonth: typeof tasks = [];

        tasks.forEach(task => {
            if (task.completedAt) {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (task.completedAt > weekAgo.getTime()) thisWeek.push(task);
                if (task.completedAt > monthAgo.getTime()) thisMonth.push(task);
            }
        });

        // Calculate time-of-day productivity
        const hourCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0 };
        thisWeek.forEach(task => {
            const hour = new Date(task.completedAt!).getHours();
            hourCounts[hour]++;
        });

        const morningTasks = [6, 7, 8, 9, 10, 11].reduce((sum, h) => sum + hourCounts[h], 0);
        const afternoonTasks = [12, 13, 14, 15, 16].reduce((sum, h) => sum + hourCounts[h], 0);
        const eveningTasks = [17, 18, 19, 20, 21, 22].reduce((sum, h) => sum + hourCounts[h], 0);
        const totalDayTasks = morningTasks + afternoonTasks + eveningTasks || 1;

        return {
            overall: Math.min(100, Math.round((thisWeek.length / 21) * 100)),
            morningScore: Math.round((morningTasks / totalDayTasks) * 100),
            afternoonScore: Math.round((afternoonTasks / totalDayTasks) * 100),
            eveningScore: Math.round((eveningTasks / totalDayTasks) * 100),
            focusScore: 75, // Placeholder
            consistencyScore: thisMonth.length > 0 ? Math.min(100, Math.round((thisWeek.length / thisMonth.length) * 100)) : 50,
            calculatedAt: Date.now(),
        };
    }

    generateSuggestions(insights: HabitInsight[], productivity: ProductivityScore): SmartSuggestion[] {
        const suggestions: SmartSuggestion[] = [];

        // Time optimization suggestions
        if (productivity.morningScore > productivity.afternoonScore && productivity.morningScore > 40) {
            suggestions.push({
                id: `sug-morning-${Date.now()}`,
                type: "time_optimization",
                title: "You're most productive in the morning",
                description: "Consider scheduling your most important tasks before noon to leverage your peak productivity hours.",
                priority: 8,
                actionData: { preferredTime: "morning" },
                dismissed: false,
                generatedAt: Date.now(),
            });
        }

        // Streak motivation
        const streakInsights = insights.filter(i => i.type === "streak");
        if (streakInsights.length > 0) {
            suggestions.push({
                id: `sug-streak-${Date.now()}`,
                type: "streak_motivation",
                title: "Keep your streaks alive!",
                description: "You have strong habits forming. Consistency is key to long-term success.",
                priority: 6,
                dismissed: false,
                generatedAt: Date.now(),
            });
        }

        // Habit formation
        const habitInsights = insights.filter(i => i.type === "consistency" && i.confidence < 0.9);
        if (habitInsights.length > 0) {
            suggestions.push({
                id: `sug-habit-${Date.now()}`,
                type: "habit_formation",
                title: "Build on your emerging habits",
                description: "We've detected patterns in your behavior. Turning these into routines can boost your productivity.",
                priority: 7,
                dismissed: false,
                generatedAt: Date.now(),
            });
        }

        return suggestions;
    }

    updateHistory(tasks: Array<{ id: string; name: string; completedAt?: number; category?: string }>) {
        this.taskHistory = tasks.filter(t => t.completedAt).map(t => ({
            id: t.id,
            name: t.name,
            completedAt: t.completedAt!,
            category: t.category || "uncategorized",
        }));
    }
}

// ============================================================================
// NLP UTILITIES (Inline implementation)
// ============================================================================

class NLPProcessor {
    private priorityKeywords: Record<string, string[]> = {
        "critical": ["urgent", "asap", "immediately", "emergency", "critical", "priority 1", "p1"],
        "high": ["important", "urgent", "priority", "soon", "high priority"],
        "medium": ["should", "need to", "wanted", "prefer"],
        "low": ["when possible", "sometime", "maybe", "low priority", "eventually"],
    };

    private timePatterns = [
        { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i, type: "time" },
        { pattern: /(today|tomorrow|tonight|this evening|this afternoon|this morning)/i, type: "relative_day" },
        { pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: "day_of_week" },
        { pattern: /(in\s+)?(\d+)\s*(minute|hour|day|week)s?/i, type: "relative_time" },
    ];

    parse(input: string): { intent: IntentType; entities: Entity[]; sentiment: "positive" | "neutral" | "negative"; urgency: "low" | "medium" | "high" } {
        const lowerInput = input.toLowerCase();
        const entities: Entity[] = [];

        // Detect intent
        let intent: IntentType = this.detectIntent(lowerInput);

        // Extract task name
        const taskMatch = this.extractTaskName(lowerInput);
        if (taskMatch) {
            entities.push({
                type: "task_name",
                value: taskMatch,
                confidence: 0.9,
                startIndex: 0,
                endIndex: taskMatch.length,
            });
        }

        // Extract time entities
        this.timePatterns.forEach(({ pattern, type }) => {
            const match = input.match(pattern);
            if (match) {
                entities.push({
                    type: type === "time" ? "time" : "date",
                    value: match[0],
                    confidence: 0.85,
                    startIndex: match.index || 0,
                    endIndex: (match.index || 0) + match[0].length,
                });
            }
        });

        // Detect priority
        let urgency: "low" | "medium" | "high" = "medium";
        for (const [level, keywords] of Object.entries(this.priorityKeywords)) {
            if (keywords.some(kw => lowerInput.includes(kw))) {
                urgency = level as "low" | "medium" | "high";
                break;
            }
        }

        // Detect sentiment
        let sentiment: "positive" | "neutral" | "negative" = "neutral";
        if (/great|excellent|amazing|wonderful|love/i.test(lowerInput)) {
            sentiment = "positive";
        } else if (/bad|terrible|hate|awful|failed|missed/i.test(lowerInput)) {
            sentiment = "negative";
        }

        return { intent, entities, sentiment, urgency };
    }

    private detectIntent(input: string): IntentType {
        if (/create|add|new|make|schedule/i.test(input)) return "create_task";
        if (/complete|done|finished|check off/i.test(input)) return "complete_task";
        if (/delete|remove|cancel|drop/i.test(input)) return "delete_task";
        if (/update|change|modify|edit/i.test(input)) return "update_task";
        if (/remind|alarm|notify/i.test(input)) return "set_reminder";
        if (/focus|timer|pomodoro/i.test(input)) return "adjust_focus";
        if (/routine|habit|daily|weekly/i.test(input)) return "create_routine";
        if (/how many|stats|progress|performance/i.test(input)) return "get_insights";
        if (/what|tell me|show me|help/i.test(input)) return "chat";
        return "unknown";
    }

    private extractTaskName(input: string): string {
        // Remove common action verbs and get the core task description
        let cleaned = input
            .replace(/^(create|add|new|make|schedule|complete|delete|update|set)\s+(a\s+)?(new\s+)?/i, "")
            .replace(/(for me|please|thanks?|thank you)/gi, "")
            .trim();

        // Remove time expressions
        this.timePatterns.forEach(({ pattern }) => {
            cleaned = cleaned.replace(pattern, "").trim();
        });

        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    parseDateTime(input: string): { date: string | null; time: string | null; isRecurring: boolean } {
        const now = new Date();
        let date: string | null = null;
        let time: string | null = null;
        const lowerInput = input.toLowerCase();

        // Extract time
        const timeMatch = input.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            const period = timeMatch[3]?.toLowerCase();
            
            if (period === "pm" && hours < 12) hours += 12;
            if (period === "am" && hours === 12) hours = 0;
            
            time = `${hours.toString().padStart(2, "0")}:${minutes}`;
        }

        // Extract date
        if (/\btoday\b/i.test(input)) {
            date = now.toISOString().split("T")[0];
        } else if (/\btomorrow\b/i.test(input)) {
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            date = tomorrow.toISOString().split("T")[0];
        } else if (/\bmonday\b/i.test(input)) date = this.getNextDayOfWeek(1);
        else if (/\btuesday\b/i.test(input)) date = this.getNextDayOfWeek(2);
        else if (/\bwednesday\b/i.test(input)) date = this.getNextDayOfWeek(3);
        else if (/\bthursday\b/i.test(input)) date = this.getNextDayOfWeek(4);
        else if (/\bfriday\b/i.test(input)) date = this.getNextDayOfWeek(5);
        else if (/\bsaturday\b/i.test(input)) date = this.getNextDayOfWeek(6);
        else if (/\bsunday\b/i.test(input)) date = this.getNextDayOfWeek(0);

        // Check for recurring
        const isRecurring = /every|daily|weekly|monthly|recurring/i.test(lowerInput);

        return { date, time, isRecurring };
    }

    private getNextDayOfWeek(dayOfWeek: number): string {
        const now = new Date();
        const resultDate = new Date(now);
        resultDate.setDate(now.getDate() + ((dayOfWeek + 7 - now.getDay()) % 7 || 7));
        return resultDate.toISOString().split("T")[0];
    }
}

// ============================================================================
// TOOL REGISTRY
// ============================================================================

const TOOL_REGISTRY: ToolDefinition[] = [
    {
        id: "create_task",
        name: "Create Task",
        description: "Create a new task with optional scheduling and priority",
        parameters: [
            { name: "name", type: "string", required: true, description: "Task name" },
            { name: "date", type: "string", required: false, description: "Due date (YYYY-MM-DD)" },
            { name: "time", type: "string", required: false, description: "Due time (HH:MM)" },
            { name: "priority", type: "number", required: false, description: "Priority 1-4", defaultValue: 2 },
            { name: "category", type: "string", required: false, description: "Task category" },
        ],
        returns: { type: "object", description: "Created task object" },
        requiresConfirmation: false,
        category: "task_management",
    },
    {
        id: "complete_task",
        name: "Complete Task",
        description: "Mark a task as completed",
        parameters: [
            { name: "taskId", type: "string", required: true, description: "Task ID" },
        ],
        returns: { type: "boolean", description: "Success status" },
        requiresConfirmation: false,
        category: "task_management",
    },
    {
        id: "get_insights",
        name: "Get Insights",
        description: "Generate productivity insights and analytics",
        parameters: [
            { name: "timeRange", type: "string", required: false, description: "Time range (week, month, all)" },
        ],
        returns: { type: "object", description: "Insights object" },
        requiresConfirmation: false,
        category: "insight_generation",
    },
    {
        id: "start_focus",
        name: "Start Focus Session",
        description: "Start a focus timer session",
        parameters: [
            { name: "duration", type: "number", required: false, description: "Duration in minutes", defaultValue: 25 },
            { name: "taskId", type: "string", required: false, description: "Associated task ID" },
        ],
        returns: { type: "object", description: "Session object" },
        requiresConfirmation: true,
        category: "focus_control",
    },
];

// ============================================================================
// AGENT SERVICE CLASS
// ============================================================================

class AgentService {
    private state: AgentState;
    private intelligence: LocalIntelligenceEngine;
    private nlp: NLPProcessor;
    private actionQueue: Map<string, AgentAction> = new Map();
    private toolRegistry: Map<string, ToolDefinition> = new Map();

    constructor() {
        this.state = {
            status: "idle",
            currentTask: null,
            lastAction: null,
            contextWindow: [],
            workingMemory: {
                currentGoal: null,
                subgoals: [],
                pendingActions: [],
                recentContext: [],
                userPreferences: new Map(),
            },
            longTermMemory: {
                userFacts: [],
                habitPatterns: [],
                taskHistory: [],
                preferenceScores: new Map(),
                lastUpdated: Date.now(),
            },
        };

        this.intelligence = new LocalIntelligenceEngine();
        this.nlp = new NLPProcessor();

        // Register tools
        TOOL_REGISTRY.forEach(tool => this.toolRegistry.set(tool.id, tool));
    }

    // ============================================================================
    // PERCEPTION LAYER
    // ============================================================================

    processInput(input: string): ParsedInput {
        this.updateStatus("perceiving");
        
        const parsed = this.nlp.parse(input);
        
        // Update working memory with recent context
        this.state.workingMemory.recentContext.push(input);
        if (this.state.workingMemory.recentContext.length > 5) {
            this.state.workingMemory.recentContext.shift();
        }

        return parsed;
    }

    // ============================================================================
    // REASONING LAYER
    // ============================================================================

    async reason(perception: ParsedInput, userGoals: string[]): Promise<ReasoningTrace> {
        this.updateStatus("reasoning");

        const thoughts: string[] = [];
        const alternatives: string[] = [];
        let confidence = 0.7;
        let strategy: ReasoningStrategy = "direct_execution";

        // Strategy selection based on intent complexity
        switch (perception.intent) {
            case "create_task":
            case "complete_task":
            case "delete_task":
                strategy = "direct_execution";
                thoughts.push("Intent is straightforward - executing action directly");
                confidence = 0.95;
                break;

            case "create_routine":
            case "schedule_task":
                strategy = "multi_step_planning";
                thoughts.push("Complex intent detected - breaking into steps");
                thoughts.push("Step 1: Parse task details");
                thoughts.push("Step 2: Check for conflicts");
                thoughts.push("Step 3: Create task with scheduling");
                confidence = 0.85;
                break;

            case "get_insights":
                strategy = "context_injection";
                thoughts.push("Requesting analytics - gathering relevant data");
                thoughts.push("Will inject productivity context from local intelligence");
                confidence = 0.9;
                break;

            case "unknown":
                strategy = "clarification_needed";
                thoughts.push("Unable to determine user intent");
                alternatives.push("Ask user to clarify");
                alternatives.push("Suggest common actions");
                confidence = 0.3;
                break;

            default:
                thoughts.push("Processing general request");
                confidence = 0.7;
        }

        // Consider user goals in reasoning
        if (userGoals.length > 0) {
            thoughts.push(`Considering active goals: ${userGoals.join(", ")}`);
            if (perception.intent === "create_task") {
                thoughts.push("New task aligns with stated goals - will set goal context");
            }
        }

        const trace: ReasoningTrace = {
            thoughtProcess: thoughts,
            alternativesConsidered: alternatives,
            confidence,
            strategy,
        };

        // Add to context window
        this.addToContextWindow(perception, trace, null);

        return trace;
    }

    // ============================================================================
    // ACTION LAYER
    // ============================================================================

    async executeAction(type: ActionType, parameters: Record<string, any>): Promise<ActionResult> {
        this.updateStatus("acting");

        const action: AgentAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            parameters,
            dependsOn: [],
            status: "executing",
            timestamp: Date.now(),
        };

        this.actionQueue.set(action.id, action);

        const startTime = Date.now();

        try {
            let result: any;

            // Execute based on action type
            switch (type) {
                case "create_task":
                    result = await this.executeCreateTask(parameters);
                    break;
                case "complete_task":
                    result = await this.executeCompleteTask(parameters);
                    break;
                case "generate_insight":
                    result = await this.executeGetInsights();
                    break;
                case "start_focus_session":
                    result = await this.executeStartFocus(parameters);
                    break;
                case "provide_suggestion":
                    result = { suggestions: parameters.suggestions };
                    break;
                default:
                    result = { message: `Action ${type} processed` };
            }

            action.status = "completed";
            action.result = {
                success: true,
                data: result,
                executionTime: Date.now() - startTime,
            };

            this.state.lastAction = action;

            return action.result!;

        } catch (error) {
            action.status = "failed";
            action.result = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                executionTime: Date.now() - startTime,
            };

            return action.result!;
        }
    }

    private async executeCreateTask(params: Record<string, any>): Promise<any> {
        const { name, date, time, priority, category } = params;
        
        // This would integrate with the actual task creation system
        console.log("Creating task:", { name, date, time, priority, category });
        
        return {
            taskId: `task-${Date.now()}`,
            name,
            date,
            time,
            priority: priority || 2,
            category,
            createdAt: Date.now(),
        };
    }

    private async executeCompleteTask(params: Record<string, any>): Promise<any> {
        const { taskId } = params;
        
        console.log("Completing task:", taskId);
        
        return {
            success: true,
            taskId,
            completedAt: Date.now(),
        };
    }

    private async executeGetInsights(): Promise<any> {
        // Get insights from local intelligence
        const tasks = this.state.longTermMemory.taskHistory;
        const insights = await this.intelligence.analyzeHabits(tasks);
        
        // Map TaskRecord to the format expected by calculateProductivityScore
        const productivityTasks = tasks.map(t => ({
            completedAt: t.completedAt,
            createdAt: t.completedAt - t.duration, // Estimate createdAt from completedAt - duration
            category: t.category,
        }));
        
        const productivity = await this.intelligence.calculateProductivityScore(productivityTasks);
        const suggestions = this.intelligence.generateSuggestions(insights, productivity);

        return {
            insights,
            productivity,
            suggestions,
            generatedAt: Date.now(),
        };
    }

    private async executeStartFocus(params: Record<string, any>): Promise<any> {
        const { duration, taskId } = params;
        
        console.log("Starting focus session:", { duration, taskId });
        
        return {
            sessionId: `session-${Date.now()}`,
            duration: duration || 25,
            taskId,
            startedAt: Date.now(),
        };
    }

    // ============================================================================
    // INTELLIGENCE METHODS
    // ============================================================================

    async getHabitInsights(tasks: Array<{ id: string; name: string; completedAt?: number; category?: string }>): Promise<HabitInsight[]> {
        this.intelligence.updateHistory(tasks);
        return this.intelligence.analyzeHabits(tasks);
    }

    async getProductivityScore(tasks: Array<{ completedAt?: number; createdAt: number; category?: string }>): Promise<ProductivityScore> {
        return this.intelligence.calculateProductivityScore(tasks);
    }

    getSuggestions(insights: HabitInsight[], productivity: ProductivityScore): SmartSuggestion[] {
        return this.intelligence.generateSuggestions(insights, productivity);
    }

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    private updateStatus(status: AgentStatus) {
        this.state.status = status;
    }

    getState(): AgentState {
        return { ...this.state };
    }

    setGoal(goal: string) {
        this.state.workingMemory.currentGoal = goal;
    }

    clearGoal() {
        this.state.workingMemory.currentGoal = null;
    }

    addSubgoal(goal: string) {
        this.state.workingMemory.subgoals.push(goal);
    }

    clearSubgoals() {
        this.state.workingMemory.subgoals = [];
    }

    // ============================================================================
    // CONTEXT WINDOW MANAGEMENT
    // ============================================================================

    private addToContextWindow(
        perception: ParsedInput,
        reasoning: ReasoningTrace,
        action: AgentAction | null
    ) {
        const frame = {
            id: `frame-${Date.now()}`,
            timestamp: Date.now(),
            perception,
            reasoning,
            action,
        };

        this.state.contextWindow.push(frame);

        // Keep only last 10 frames
        if (this.state.contextWindow.length > 10) {
            this.state.contextWindow.shift();
        }
    }

    // ============================================================================
    // TOOL METHODS
    // ============================================================================

    getTools(): ToolDefinition[] {
        return Array.from(this.toolRegistry.values());
    }

    getTool(id: string): ToolDefinition | undefined {
        return this.toolRegistry.get(id);
    }

    // ============================================================================
    // PARSING HELPERS
    // ============================================================================

    parseTaskInput(input: string): { name: string; date: string | null; time: string | null; isRecurring: boolean; priority: number; category: string | null; duration: number | null } {
        const parsed = this.nlp.parseDateTime(input);
        const parsedFull = this.nlp.parse(input);
        
        const taskName = parsedFull.entities.find(e => e.type === "task_name")?.value || input;
        
        let priority = 2;
        if (parsedFull.urgency === "high") priority = 3;
        if (parsedFull.urgency === "low") priority = 1;

        return {
            name: taskName,
            date: parsed.date,
            time: parsed.time,
            isRecurring: parsed.isRecurring,
            priority,
            category: parsedFull.entities.find(e => e.type === "category")?.value || null,
            duration: parsedFull.entities.find(e => e.type === "duration") ? 
                this.parseDurationValue(parsedFull.entities.find(e => e.type === "duration")!.value) : null,
        };
    }

    private parseDurationValue(value: string): number | null {
        const match = value.match(/(\d+)\s*(min|hour)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (match[2].toLowerCase().startsWith("hour")) return num * 3600;
            return num * 60;
        }
        return null;
    }
}

// Export singleton instance
export const agentService = new AgentService();

// Export types for external use
export type { LocalIntelligenceEngine, NLPProcessor };
