"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { localIntelligence } from "@/lib/agent/LocalIntelligence";
import { useTask } from "@/context/TaskContext";
import { toast } from "sonner";
import { SmartSuggestion, HabitInsight, ProductivityScore } from "@/lib/agent/types";

// ============================================================================
// SMART SUGGESTIONS COMPONENT
// ============================================================================

interface SmartSuggestionsProps {
    maxVisible?: number;
    showProductivity?: boolean;
    showHabits?: boolean;
    showActions?: boolean;
    className?: string;
    onDismiss?: (id: string) => void;
    onAction?: (suggestion: SmartSuggestion) => void;
}

interface SuggestionWithMetadata extends SmartSuggestion {
    isNew: boolean;
    category: "productivity" | "habit" | "action" | "insight";
}

export function SmartSuggestions({
    maxVisible = 3,
    showProductivity = true,
    showHabits = true,
    showActions = true,
    className = "",
    onDismiss,
    onAction,
}: SmartSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<SuggestionWithMetadata[]>([]);
    const [insights, setInsights] = useState<HabitInsight[]>([]);
    const [productivity, setProductivity] = useState<ProductivityScore | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const { tasks } = useTask();

    // Load suggestions and insights
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);

            try {
                // Analyze tasks for insights
                const taskData = tasks.map(t => ({
                    id: t.id,
                    name: t.title,
                    completedAt: t.isCompleted ? (t.lastCompletedDate ? new Date(t.lastCompletedDate).getTime() : Date.now()) : undefined,
                    createdAt: t.createdAt ? (typeof t.createdAt === 'string' ? new Date(t.createdAt).getTime() : Date.now()) : Date.now(), // Fallback
                    category: "General", // Default as Task doesn't have category
                    duration: undefined,
                }));

                // Get analysis from local intelligence
                const analysis = localIntelligence.analyze(taskData);

                // Convert insights to suggestions
                const insightSuggestions = analysis.insights
                    .filter(i => i.actionable)
                    .map(insight => ({
                        id: `insight-${insight.id}`,
                        type: "productivity_tip" as const,
                        title: insight.title,
                        description: insight.description,
                        priority: Math.round(insight.confidence * 10),
                        actionData: { action: insight.action },
                        dismissed: false,
                        generatedAt: insight.generatedAt,
                        isNew: true,
                        category: "insight" as const,
                    }));

                // Get regular suggestions
                const regularSuggestions = analysis.suggestions.map(s => ({
                    ...s,
                    isNew: true,
                    category: categorizeSuggestion(s.type),
                }));

                // Combine and deduplicate
                const allSuggestions = [...insightSuggestions, ...regularSuggestions];
                const uniqueSuggestions = deduplicateSuggestions(allSuggestions);

                setSuggestions(uniqueSuggestions);
                setInsights(analysis.insights);
                setProductivity(analysis.productivity);

            } catch (error) {
                console.error("Failed to load suggestions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // Refresh every 5 minutes
        const interval = setInterval(loadData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [tasks.length, tasks.map(t => t.isCompleted).join(",")]);

    // Filter suggestions based on props
    const filteredSuggestions = useMemo(() => {
        return suggestions.filter(s => {
            if (!showActions && s.category === "action") return false;
            if (!showHabits && s.category === "habit") return false;
            if (!showProductivity && (s.category === "productivity" || s.category === "insight")) return false;
            return true;
        });
    }, [suggestions, showActions, showHabits, showProductivity]);

    // Visible suggestions
    const visibleSuggestions = isExpanded
        ? filteredSuggestions
        : filteredSuggestions.slice(0, maxVisible);

    // Dismiss suggestion
    const handleDismiss = useCallback((id: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== id));
        onDismiss?.(id);
    }, [onDismiss]);

    // Handle suggestion action
    const handleAction = useCallback((suggestion: SuggestionWithMetadata) => {
        // Mark as not new
        setSuggestions(prev => prev.map(s =>
            s.id === suggestion.id ? { ...s, isNew: false } : s
        ));

        // Execute action if callback provided
        if (onAction) {
            onAction(suggestion);
        } else {
            // Default actions
            switch (suggestion.type) {
                case "habit_formation":
                    toast.info("Creating routine...");
                    break;
                case "time_optimization":
                    toast.info("Adjusting your schedule...");
                    break;
                case "break_reminder":
                    toast.success("Take a break! You've earned it.");
                    break;
                case "streak_motivation":
                    toast.success("Keep up the great work!");
                    break;
                default:
                    toast.info(suggestion.title);
            }
        }
    }, [onAction]);

    // Mark suggestion as read
    const handleMarkRead = useCallback((id: string) => {
        setSuggestions(prev => prev.map(s =>
            s.id === id ? { ...s, isNew: false } : s
        ));
    }, []);

    if (isLoading) {
        return (
            <div className={`smart-suggestions ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="space-y-2">
                        <div className="h-16 bg-gray-100 rounded-lg" />
                        <div className="h-16 bg-gray-100 rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (filteredSuggestions.length === 0) {
        return null;
    }

    return (
        <div className={`smart-suggestions ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Smart Suggestions
                </h3>

                {productivity && (
                    <ProductivityBadge score={productivity.overall} />
                )}
            </div>

            {/* Suggestions list */}
            <div className="space-y-2">
                {visibleSuggestions.map(suggestion => (
                    <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onDismiss={handleDismiss}
                        onAction={handleAction}
                        onMarkRead={handleMarkRead}
                    />
                ))}
            </div>

            {/* Expand/Collapse button */}
            {filteredSuggestions.length > maxVisible && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                    {isExpanded
                        ? `Show less (${filteredSuggestions.length - maxVisible} hidden)`
                        : `Show ${filteredSuggestions.length - maxVisible} more suggestions`
                    }
                </button>
            )}
        </div>
    );
}

// ============================================================================
// SUGGESTION CARD COMPONENT
// ============================================================================

interface SuggestionCardProps {
    suggestion: SuggestionWithMetadata;
    onDismiss: (id: string) => void;
    onAction: (suggestion: SuggestionWithMetadata) => void;
    onMarkRead: (id: string) => void;
}

function SuggestionCard({ suggestion, onDismiss, onAction, onMarkRead }: SuggestionCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const getTypeConfig = () => {
        const configs: Record<string, { icon: string; color: string; bgColor: string }> = {
            habit_formation: { icon: "🔄", color: "text-purple-600", bgColor: "bg-purple-50" },
            time_optimization: { icon: "⏰", color: "text-blue-600", bgColor: "bg-blue-50" },
            break_reminder: { icon: "☕", color: "text-orange-600", bgColor: "bg-orange-50" },
            streak_motivation: { icon: "🔥", color: "text-red-600", bgColor: "bg-red-50" },
            context_switch: { icon: "🔀", color: "text-indigo-600", bgColor: "bg-indigo-50" },
            routine_suggestion: { icon: "📋", color: "text-teal-600", bgColor: "bg-teal-50" },
            productivity_tip: { icon: "💡", color: "text-yellow-600", bgColor: "bg-yellow-50" },
            goal_alignment: { icon: "🎯", color: "text-green-600", bgColor: "bg-green-50" },
        };
        return configs[suggestion.type] || { icon: "✨", color: "text-gray-600", bgColor: "bg-gray-50" };
    };

    const config = getTypeConfig();

    const handleCardClick = () => {
        onMarkRead(suggestion.id);
        onAction(suggestion);
    };

    return (
        <div
            className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer ${suggestion.isNew
                ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                : "border-gray-100 bg-white hover:border-gray-200"
                } ${isHovered ? "shadow-md transform -translate-y-0.5" : "shadow-sm"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
        >
            <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center text-sm`}>
                    {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-700 truncate">
                            {suggestion.title}
                        </h4>

                        {/* Dismiss button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(suggestion.id);
                            }}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Dismiss"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {suggestion.description}
                    </p>

                    {/* New badge */}
                    {suggestion.isNew && (
                        <span className="inline-flex items-center mt-2 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded">
                            New
                        </span>
                    )}
                </div>
            </div>

            {/* Hover action indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"
                }`} />
        </div>
    );
}

// ============================================================================
// PRODUCTIVITY BADGE COMPONENT
// ============================================================================

interface ProductivityBadgeProps {
    score: number;
}

function ProductivityBadge({ score }: ProductivityBadgeProps) {
    const getScoreConfig = () => {
        if (score >= 80) return { label: "Great", color: "text-green-600", bgColor: "bg-green-100" };
        if (score >= 60) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
        if (score >= 40) return { label: "Okay", color: "text-yellow-600", bgColor: "bg-yellow-100" };
        return { label: "Low", color: "text-orange-600", bgColor: "bg-orange-100" };
    };

    const config = getScoreConfig();

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}>
            <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
            <span className={`text-xs font-bold ${config.color}`}>
                {score}%
            </span>
        </div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function categorizeSuggestion(type: SmartSuggestion["type"]): "productivity" | "habit" | "action" | "insight" {
    const habitTypes: SmartSuggestion["type"][] = ["habit_formation", "routine_suggestion", "streak_motivation"];
    const productivityTypes: SmartSuggestion["type"][] = ["time_optimization", "productivity_tip", "goal_alignment"];
    const actionTypes: SmartSuggestion["type"][] = ["break_reminder", "context_switch"];

    if (habitTypes.includes(type)) return "habit";
    if (productivityTypes.includes(type)) return "productivity";
    if (actionTypes.includes(type)) return "action";
    return "insight";
}

function deduplicateSuggestions(suggestions: SuggestionWithMetadata[]): SuggestionWithMetadata[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
        const key = s.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export default SmartSuggestions;
