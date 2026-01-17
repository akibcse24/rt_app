"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { parseTaskInput, ParsedTask, formatParsedTask } from "@/lib/nlpUtils";
import { agentService } from "@/lib/agent/AgentService";
import { useTask } from "@/context/TaskContext";
import { useAI } from "@/context/AIContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// SMART TASK INPUT COMPONENT
// ============================================================================

interface SmartTaskInputProps {
    onTaskCreated?: (task: any) => void;
    placeholder?: string;
    autoFocus?: boolean;
    showAnalysis?: boolean;
    className?: string;
}

interface ParsedPreview {
    show: boolean;
    parsed: ParsedTask | null;
    analysis: {
        intent: string;
        priority: string;
        timing: string;
        category: string;
    };
}

export function SmartTaskInput({
    onTaskCreated,
    placeholder = "What needs to be done? (e.g., 'Meeting tomorrow at 2pm')",
    autoFocus = false,
    showAnalysis = true,
    className = "",
}: SmartTaskInputProps) {
    const [input, setInput] = useState("");
    const [parsedPreview, setParsedPreview] = useState<ParsedPreview>({
        show: false,
        parsed: null,
        analysis: {
            intent: "",
            priority: "",
            timing: "",
            category: "",
        },
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const { addTask, tasks } = useTask();
    const { sendMessage } = useAI();
    const { changePreset, toggleTimer, linkTask } = useFocusTimer();

    // specific helper for smart schedule which isn't in context anymore
    const generateSmartSchedule = async (name: string, tasks: any[], options: any) => {
        // Simplified dummy implementation or integration with sendMessage if needed
        return null;
    };

    // Parse input in real-time
    const updatePreview = useCallback((value: string) => {
        if (!value.trim()) {
            setParsedPreview(prev => ({ ...prev, show: false, parsed: null }));
            return;
        }

        const parsed = parseTaskInput(value);
        setParsedPreview({
            show: true,
            parsed,
            analysis: {
                intent: parsed.intent.charAt(0).toUpperCase() + parsed.intent.slice(1),
                priority: getPriorityLabel(parsed.priority),
                timing: formatTiming(parsed),
                category: parsed.category || "General",
            },
        });
    }, []);

    // Handle input change with debounce
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);

        // Debounce preview update
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            updatePreview(value);
        }, 150);
    }, [updatePreview]);

    // Focus input on mount
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Cleanup debounce
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Handle task creation
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim()) return;

        setIsProcessing(true);

        try {
            const parsed = parseTaskInput(input);

            // Route based on intent
            switch (parsed.intent) {
                case "focus":
                    await handleFocusIntent(parsed);
                    break;

                case "query":
                    handleQueryIntent(parsed);
                    break;

                case "create":
                case "schedule":
                case "unknown":
                default:
                    await handleCreateIntent(parsed);
                    break;
            }

            // Clear input
            setInput("");
            setParsedPreview({ show: false, parsed: null, analysis: { intent: "", priority: "", timing: "", category: "" } });

        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("Failed to create task. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    }, [input]);

    // Handle create intent
    const handleCreateIntent = async (parsed: ParsedTask) => {
        // Use AI to smart schedule if there's a date/time
        // Smart scheduling disabled for now
        let scheduledData: any = null;

        const taskData = {
            title: parsed.name,
            icon: "📝",
            startTime: parsed.time || "09:00",
            endTime: "10:00", // default 1 hour
            timeBlock: "Morning" as const, // default
            days: parsed.isRecurring ? ["MON", "TUE", "WED", "THU", "FRI"] : [],
            specificDate: parsed.date || (parsed.isRecurring ? undefined : new Date().toISOString().split("T")[0]),
        };

        await addTask(taskData);

        let message = `Created task: ${parsed.name}`;
        if (scheduledData?.reason) {
            message += `. ${scheduledData.reason}`;
        }

        toast.success(message);
        onTaskCreated?.(taskData);
    };

    // Handle focus intent
    const handleFocusIntent = async (parsed: ParsedTask) => {
        const duration = parsed.duration || parsed.name.match(/(\d+)/)?.[1] || "25";
        const durationMinutes = parseInt(String(duration)) || 25;

        // Extract task name from focus command
        let taskName = parsed.name
            .replace(/focus|timer|pomodoro|start|begin/i, "")
            .replace(/for\s+\d+\s*(min|minute|hour)s?/i, "")
            .trim();

        if (!taskName) {
            taskName = "General focus session";
        }

        changePreset("custom", {
            id: "custom", // Added required field
            name: "Custom Focus",
            icon: "⚡", // Added required field
            description: "Custom duration", // Added required field
            color: "blue", // Added required field
            focusMinutes: durationMinutes,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
        });

        linkTask("temp-id", taskName);
        toggleTimer();

        toast.success(`Starting ${durationMinutes} minute focus session`);
    };

    // Handle query intent
    const handleQueryIntent = (parsed: ParsedTask) => {
        const pendingTasks = tasks.filter(t => !t.isCompleted);
        const todayTasks = pendingTasks.filter(t => t.specificDate === new Date().toISOString().split("T")[0]);

        let response = `You have ${todayTasks.length} tasks due today`;
        if (pendingTasks.length > todayTasks.length) {
            response += ` and ${pendingTasks.length - todayTasks.length} upcoming tasks`;
        }



        toast.info(response);
    };

    // Handle quick actions
    const handleQuickAction = useCallback((action: string) => {
        switch (action) {
            case "today":
                setInput("Task for today at ");
                break;
            case "tomorrow":
                setInput("Task for tomorrow at ");
                break;
            case "weekly":
                setInput("Weekly routine: ");
                break;
            case "focus":
                setInput("Focus timer for 25 minutes ");
                break;
        }
        inputRef.current?.focus();
    }, []);

    return (
        <div className={`smart-task-input ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                {/* Main input area */}
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 pr-24 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-[120px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />

                    {/* Action buttons */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setShowSuggestions(!showSuggestions)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Quick actions"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                        <button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className={`p-2 rounded-lg transition-all ${input.trim() && !isProcessing
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            title="Create task (Enter)"
                        >
                            {isProcessing ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick actions panel */}
                {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                        <div className="text-xs text-gray-500 px-2 py-1 mb-1">Quick actions</div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickAction("today")}
                                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                + Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickAction("tomorrow")}
                                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                + Tomorrow
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickAction("weekly")}
                                className="px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                + Weekly
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickAction("focus")}
                                className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                + Focus
                            </button>
                        </div>
                    </div>
                )}

                {/* Parsed preview panel */}
                {showAnalysis && parsedPreview.show && parsedPreview.parsed && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        {/* Parsed task name */}
                        <div className="text-sm font-medium text-gray-700 mb-2">
                            {parsedPreview.parsed.name || <span className="text-gray-400 italic">Waiting for task name...</span>}
                        </div>

                        {/* Analysis badges */}
                        <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getIntentColor(parsedPreview.parsed.intent)
                                }`}>
                                {parsedPreview.analysis.intent}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(parsedPreview.parsed.priority)
                                }`}>
                                {parsedPreview.analysis.priority}
                            </span>
                            {parsedPreview.parsed.date && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {formatDateDisplay(parsedPreview.parsed.date)}
                                </span>
                            )}
                            {parsedPreview.parsed.time && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {formatTimeDisplay(parsedPreview.parsed.time)}
                                </span>
                            )}
                            {parsedPreview.parsed.isRecurring && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Recurring
                                </span>
                            )}
                            {parsedPreview.parsed.category && parsedPreview.parsed.category !== "General" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    {parsedPreview.analysis.category}
                                </span>
                            )}
                        </div>

                        {/* Duration indicator */}
                        {parsedPreview.parsed.duration && (
                            <div className="mt-2 text-xs text-gray-500">
                                Duration: {Math.round(parsedPreview.parsed.duration / 60)} minutes
                            </div>
                        )}
                    </div>
                )}

                {/* Keyboard shortcuts hint */}
                {!input && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span>Enter to create</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>Shift+Enter for new line</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>@ for quick actions</span>
                    </div>
                )}
            </form>
        </div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPriorityLabel(priority: number): string {
    const labels = ["", "Low", "Medium", "High", "Critical"];
    return labels[priority] || "Medium";
}

function getPriorityColor(priority: number): string {
    const colors = ["", "bg-gray-100 text-gray-600", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];
    return colors[priority] || colors[2];
}

function getIntentColor(intent: string): string {
    const colors: Record<string, string> = {
        create: "bg-green-100 text-green-700",
        update: "bg-blue-100 text-blue-700",
        delete: "bg-red-100 text-red-700",
        complete: "bg-emerald-100 text-emerald-700",
        focus: "bg-orange-100 text-orange-700",
        query: "bg-purple-100 text-purple-700",
        schedule: "bg-indigo-100 text-indigo-700",
        routine: "bg-teal-100 text-teal-700",
    };
    return colors[intent] || "bg-gray-100 text-gray-600";
}

function formatTiming(parsed: ParsedTask): string {
    const parts: string[] = [];
    if (parsed.date) parts.push(formatDateDisplay(parsed.date));
    if (parsed.time) parts.push(formatTimeDisplay(parsed.time));
    return parts.join(" ") || "No timing set";
}

function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return "";

    try {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        if (dateStr === today.toISOString().split("T")[0]) return "Today";
        if (dateStr === tomorrow.toISOString().split("T")[0]) return "Tomorrow";

        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
        return dateStr;
    }
}

function formatTimeDisplay(timeStr: string): string {
    if (!timeStr) return "";

    try {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes);

        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch {
        return timeStr;
    }
}

export default SmartTaskInput;
