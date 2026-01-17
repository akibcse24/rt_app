"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { agentService } from "./AgentService";
import { 
    ParsedInput, 
    SmartSuggestion, 
    HabitInsight, 
    ProductivityScore, 
    ReasoningTrace,
    ActionType 
} from "./types";

// ============================================================================
// USE AGENT HOOK
// ============================================================================

interface UseAgentOptions {
    autoAnalyze?: boolean;
    analysisInterval?: number;
}

interface UseAgentReturn {
    // State
    status: string;
    isReasoning: boolean;
    lastAction: any;
    insights: HabitInsight[];
    suggestions: SmartSuggestion[];
    productivity: ProductivityScore | null;
    
    // Actions
    processInput: (input: string) => ParsedInput;
    reason: (perception: ParsedInput, goals?: string[]) => Promise<ReasoningTrace>;
    executeAction: (type: ActionType, params?: Record<string, any>) => Promise<any>;
    getInsights: () => Promise<HabitInsight[]>;
    getSuggestions: () => Promise<SmartSuggestion[]>;
    getProductivity: () => Promise<ProductivityScore>;
    
    // Task helpers
    parseTaskInput: (input: string) => {
        name: string;
        date: string | null;
        time: string | null;
        priority: number;
        category: string | null;
        isRecurring: boolean;
        duration: number | null;
    };
    
    // State management
    setGoal: (goal: string) => void;
    clearGoal: () => void;
    addSubgoal: (goal: string) => void;
    clearSubgoals: () => void;
}

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
    const { autoAnalyze = false, analysisInterval = 60000 } = options;

    const [status, setStatus] = useState("idle");
    const [lastAction, setLastAction] = useState<any>(null);
    const [insights, setInsights] = useState<HabitInsight[]>([]);
    const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
    const [productivity, setProductivity] = useState<ProductivityScore | null>(null);

    const isReasoning = status === "reasoning" || status === "perceiving";
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-analysis interval
    useEffect(() => {
        if (autoAnalyze) {
            intervalRef.current = setInterval(async () => {
                await refreshAnalysis();
            }, analysisInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoAnalyze, analysisInterval]);

    // Refresh all analysis data
    const refreshAnalysis = useCallback(async () => {
        try {
            const newInsights = await agentService.getHabitInsights([]);
            const newProductivity = await agentService.getProductivityScore([]);
            const newSuggestions = agentService.getSuggestions(newInsights, newProductivity);

            setInsights(newInsights);
            setProductivity(newProductivity);
            setSuggestions(newSuggestions);
        } catch (error) {
            console.error("Failed to refresh analysis:", error);
        }
    }, []);

    // Process user input
    const processInput = useCallback((input: string): ParsedInput => {
        return agentService.processInput(input);
    }, []);

    // Reason about input
    const reason = useCallback(async (
        perception: ParsedInput, 
        goals: string[] = []
    ): Promise<ReasoningTrace> => {
        return agentService.reason(perception, goals);
    }, []);

    // Execute action
    const executeAction = useCallback(async (
        type: ActionType, 
        params: Record<string, any> = {}
    ): Promise<any> => {
        const result = await agentService.executeAction(type, params);
        setLastAction(result);
        return result;
    }, []);

    // Get insights
    const getInsights = useCallback(async (): Promise<HabitInsight[]> => {
        const newInsights = await agentService.getHabitInsights([]);
        setInsights(newInsights);
        return newInsights;
    }, []);

    // Get suggestions
    const getSuggestions = useCallback(async (): Promise<SmartSuggestion[]> => {
        await refreshAnalysis();
        return suggestions;
    }, [refreshAnalysis, suggestions]);

    // Get productivity
    const getProductivity = useCallback(async (): Promise<ProductivityScore> => {
        const newProductivity = await agentService.getProductivityScore([]);
        setProductivity(newProductivity);
        return newProductivity;
    }, []);

    // Parse task input
    const parseTaskInput = useCallback((input: string) => {
        return agentService.parseTaskInput(input);
    }, []);

    // Goal management
    const setGoal = useCallback((goal: string) => {
        agentService.setGoal(goal);
    }, []);

    const clearGoal = useCallback(() => {
        agentService.clearGoal();
    }, []);

    const addSubgoal = useCallback((goal: string) => {
        agentService.addSubgoal(goal);
    }, []);

    const clearSubgoals = useCallback(() => {
        agentService.clearSubgoals();
    }, []);

    return {
        status,
        isReasoning,
        lastAction,
        insights,
        suggestions,
        productivity,
        processInput,
        reason,
        executeAction,
        getInsights,
        getSuggestions,
        getProductivity,
        parseTaskInput,
        setGoal,
        clearGoal,
        addSubgoal,
        clearSubgoals,
    };
}

// ============================================================================
// USE SMART TASKS HOOK
// ============================================================================

interface UseSmartTasksOptions {
    onTaskCreated?: (task: any) => void;
    onTaskCompleted?: (task: any) => void;
}

interface UseSmartTasksReturn {
    createTask: (input: string) => Promise<any>;
    completeTask: (taskId: string) => Promise<any>;
    scheduleTask: (input: string) => Promise<any>;
    startFocus: (input: string) => Promise<any>;
    isProcessing: boolean;
    lastResult: any;
}

export function useSmartTasks(options: UseSmartTasksOptions = {}): UseSmartTasksReturn {
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const { onTaskCreated, onTaskCompleted } = options;

    const createTask = useCallback(async (input: string): Promise<any> => {
        setIsProcessing(true);
        try {
            const parsed = agentService.parseTaskInput(input);
            const result = await agentService.executeAction("create_task", {
                name: parsed.name,
                date: parsed.date,
                time: parsed.time,
                priority: parsed.priority,
                category: parsed.category,
            });
            setLastResult(result);
            onTaskCreated?.(result.data);
            return result;
        } finally {
            setIsProcessing(false);
        }
    }, [onTaskCreated]);

    const completeTask = useCallback(async (taskId: string): Promise<any> => {
        setIsProcessing(true);
        try {
            const result = await agentService.executeAction("complete_task", { taskId });
            setLastResult(result);
            onTaskCompleted?.(result.data);
            return result;
        } finally {
            setIsProcessing(false);
        }
    }, [onTaskCompleted]);

    const scheduleTask = useCallback(async (input: string): Promise<any> => {
        setIsProcessing(true);
        try {
            const parsed = agentService.parseTaskInput(input);
            const result = await agentService.executeAction("create_task", {
                name: parsed.name,
                date: parsed.date,
                time: parsed.time,
                priority: parsed.priority,
                category: parsed.category,
            });
            setLastResult(result);
            onTaskCreated?.(result.data);
            return result;
        } finally {
            setIsProcessing(false);
        }
    }, [onTaskCreated]);

    const startFocus = useCallback(async (input: string): Promise<any> => {
        setIsProcessing(true);
        try {
            const parsed = agentService.parseTaskInput(input);
            const duration = parsed.duration 
                ? Math.round(parsed.duration / 60) 
                : parseInt(parsed.name.match(/\d+/)?.[0] || "25");
            
            const result = await agentService.executeAction("start_focus_session", {
                duration,
                taskId: undefined,
            });
            setLastResult(result);
            return result;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return {
        createTask,
        completeTask,
        scheduleTask,
        startFocus,
        isProcessing,
        lastResult,
    };
}

// ============================================================================
// USE AGENT MEMORY HOOK
// ============================================================================

interface UseAgentMemoryReturn {
    facts: Array<{
        id: string;
        category: string;
        content: string;
        confidence: number;
    }>;
    patterns: Array<{
        id: string;
        name: string;
        frequency: string;
        successRate: number;
        streak: number;
    }>;
    addFact: (category: string, content: string, confidence?: number) => void;
    getFacts: (category?: string) => void;
    clearMemory: () => void;
}

export function useAgentMemory(): UseAgentMemoryReturn {
    const [facts, setFacts] = useState<UseAgentMemoryReturn["facts"]>([]);
    const [patterns, setPatterns] = useState<UseAgentMemoryReturn["patterns"]>([]);

    useEffect(() => {
        // Load initial data
        refreshData();
    }, []);

    const refreshData = useCallback(() => {
        const state = agentService.getState();
        setFacts(state.longTermMemory.userFacts.map(f => ({
            id: f.id,
            category: f.category,
            content: f.content,
            confidence: f.confidence,
        })));
        setPatterns(state.longTermMemory.habitPatterns.map(p => ({
            id: p.id,
            name: p.name,
            frequency: p.frequency,
            successRate: p.successRate,
            streak: p.streak,
        })));
    }, []);

    const addFact = useCallback((category: string, content: string, confidence = 0.8) => {
        // Facts are stored in the agent's long-term memory
        // This is a placeholder for the full implementation
        console.log("Adding fact:", { category, content, confidence });
        refreshData();
    }, [refreshData]);

    const getFacts = useCallback((category?: string) => {
        const state = agentService.getState();
        if (category) {
            return state.longTermMemory.userFacts.filter(f => f.category === category);
        }
        return state.longTermMemory.userFacts;
    }, []);

    const clearMemory = useCallback(() => {
        // Clear agent memory
        console.log("Clearing agent memory");
        refreshData();
    }, [refreshData]);

    return {
        facts,
        patterns,
        addFact,
        getFacts,
        clearMemory,
    };
}

// ============================================================================
// REACT IMPORT
// ============================================================================

import { useTask } from "@/context/TaskContext";
