// ============================================================================
// AGENT SYSTEM TYPES
// ============================================================================
// Core type definitions for the local-first agent architecture
// Separation of Perception, Reasoning, and Action layers

// ============================================================================
// PERCEPTION LAYER - Input Types
// ============================================================================

export interface VoiceInput {
    transcript: string;
    confidence: number;
    language: string;
    timestamp: number;
}

export interface TextInput {
    raw: string;
    parsed: ParsedInput;
    timestamp: number;
}

export interface ParsedInput {
    intent: IntentType;
    entities: Entity[];
    sentiment: "positive" | "neutral" | "negative";
    urgency: "low" | "medium" | "high";
}

export type IntentType = 
    | "create_task"
    | "update_task"
    | "delete_task"
    | "complete_task"
    | "schedule_task"
    | "query_status"
    | "set_reminder"
    | "create_routine"
    | "adjust_focus"
    | "get_insights"
    | "chat"
    | "unknown";

export interface Entity {
    type: EntityType;
    value: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
}

export type EntityType = 
    | "task_name"
    | "date"
    | "time"
    | "duration"
    | "priority"
    | "category"
    | "routine_name"
    | "goal"
    | "person";

// ============================================================================
// REASONING LAYER - State & Memory Types
// ============================================================================

export interface AgentState {
    status: AgentStatus;
    currentTask: string | null;
    lastAction: AgentAction | null;
    contextWindow: ContextFrame[];
    workingMemory: WorkingMemory;
    longTermMemory: LongTermMemory;
}

export type AgentStatus = 
    | "idle"
    | "perceiving"
    | "reasoning"
    | "acting"
    | "responding"
    | "error";

export interface ContextFrame {
    id: string;
    timestamp: number;
    perception: ParsedInput;
    reasoning: ReasoningTrace;
    action: AgentAction | null;
}

export interface ReasoningTrace {
    thoughtProcess: string[];
    alternativesConsidered: string[];
    confidence: number;
    strategy: ReasoningStrategy;
}

export type ReasoningStrategy = 
    | "direct_execution"
    | "multi_step_planning"
    | "clarification_needed"
    | "deferred_to_user"
    | "context_injection";

export interface WorkingMemory {
    currentGoal: string | null;
    subgoals: string[];
    pendingActions: AgentAction[];
    recentContext: string[];
    userPreferences: Map<string, number>;
}

export interface LongTermMemory {
    userFacts: StoredFact[];
    habitPatterns: HabitPattern[];
    taskHistory: TaskRecord[];
    preferenceScores: Map<string, number>;
    lastUpdated: number;
}

export interface StoredFact {
    id: string;
    category: "preference" | "habit" | "fact" | "goal";
    content: string;
    confidence: number;
    source: "explicit" | "inferred" | "behavioral";
    firstObserved: number;
    lastVerified: number;
    usageCount: number;
}

export interface HabitPattern {
    id: string;
    name: string;
    frequency: "daily" | "weekly" | "monthly" | "custom";
    trigger: string;
    action: string;
    successRate: number;
    streak: number;
    bestStreak: number;
    lastCompleted: number | null;
    averageDuration: number;
    timeDistribution: TimeSlot[];
}

export interface TimeSlot {
    hour: number;
    count: number;
}

export interface TaskRecord {
    id: string;
    name: string;
    category: string;
    completedAt: number;
    duration: number;
    wasRoutine: boolean;
    routineId?: string;
}

// ============================================================================
// ACTION LAYER - Tool & Execution Types
// ============================================================================

export interface AgentAction {
    id: string;
    type: ActionType;
    parameters: Record<string, any>;
    dependsOn: string[];
    status: ActionStatus;
    result?: ActionResult;
    timestamp: number;
}

export type ActionType = 
    | "create_task"
    | "update_task"
    | "delete_task"
    | "complete_task"
    | "schedule_reminder"
    | "start_focus_session"
    | "end_focus_session"
    | "adjust_schedule"
    | "provide_suggestion"
    | "ask_clarification"
    | "generate_insight"
    | "update_memory";

export type ActionStatus = 
    | "pending"
    | "executing"
    | "completed"
    | "failed"
    | "cancelled";

export interface ActionResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}

export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    parameters: ToolParameter[];
    returns: ToolReturn;
    requiresConfirmation: boolean;
    category: ToolCategory;
}

export type ToolCategory = 
    | "task_management"
    | "focus_control"
    | "schedule_control"
    | "insight_generation"
    | "memory_management"
    | "communication";

export interface ToolParameter {
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    description: string;
    defaultValue?: any;
}

export interface ToolReturn {
    type: "void" | "string" | "object" | "array" | "boolean";
    description: string;
}

// ============================================================================
// LOCAL INTELLIGENCE TYPES
// ============================================================================

export interface HabitInsight {
    id: string;
    type: "streak" | "consistency" | "optimization" | "suggestion";
    title: string;
    description: string;
    confidence: number;
    actionable: boolean;
    action?: string;
    relatedTasks: string[];
    generatedAt: number;
}

export interface ProductivityScore {
    overall: number;
    morningScore: number;
    afternoonScore: number;
    eveningScore: number;
    focusScore: number;
    consistencyScore: number;
    calculatedAt: number;
}

export interface ScheduleOptimization {
    id: string;
    taskId: string;
    currentPosition: number;
    suggestedPosition: number;
    reason: string;
    confidence: number;
    impact: "high" | "medium" | "low";
}

// ============================================================================
// NLP & PARSING TYPES
// ============================================================================

export interface ParsedDateTime {
    date: Date | null;
    time: string | null;
    isRecurring: boolean;
    recurrence?: RecurrencePattern;
    naturalLanguage: string;
    confidence: number;
}

export interface RecurrencePattern {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    count?: number;
}

export interface PriorityLevel {
    value: 1 | 2 | 3 | 4;
    label: "low" | "medium" | "high" | "critical";
    keywords: string[];
}

// ============================================================================
// SUGGESTION TYPES
// ============================================================================

export interface SmartSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    icon?: string;
    priority: number;
    actionData?: Record<string, any>;
    expiresAt?: number;
    dismissed: boolean;
    generatedAt: number;
}

export type SuggestionType = 
    | "habit_formation"
    | "time_optimization"
    | "break_reminder"
    | "context_switch"
    | "routine_suggestion"
    | "productivity_tip"
    | "goal_alignment"
    | "streak_motivation";

// ============================================================================
// EVENT & NOTIFICATION TYPES
// ============================================================================

export interface AgentEvent {
    type: EventType;
    payload: any;
    timestamp: number;
    source: string;
}

export type EventType = 
    | "task_created"
    | "task_completed"
    | "task_failed"
    | "focus_started"
    | "focus_ended"
    | "habit_detected"
    | "pattern_recognized"
    | "suggestion_generated"
    | "memory_updated"
    | "error_occurred";

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    data?: Record<string, any>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}
