"use client";

import React, { useState, useEffect } from "react";
import {
    Check,
    X,
    Clock,
    ExternalLink,
    Sparkles,
    TrendingUp,
    Calendar,
    Lightbulb,
} from "lucide-react";
import { useNotification, NotificationAction, AppNotification } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";

// ============================================
// Actionable Toast Component
// ============================================

interface ActionableToastProps {
    notification: AppNotification;
    onClose: () => void;
}

export const ActionableToast: React.FC<ActionableToastProps> = ({ notification, onClose }) => {
    const { executeAction } = useNotification();
    const [isExpanded, setIsExpanded] = useState(false);
    const [progress, setProgress] = useState(100);

    // Progress bar animation
    useEffect(() => {
        if (notification.priority === "urgent") return;

        const duration = 5000;
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prev - step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [notification.priority, onClose]);

    const handleAction = (action: NotificationAction) => {
        executeAction(notification.id, action.id);
        onClose();
    };

    const getIcon = () => {
        switch (notification.type) {
            case "success":
                return <Sparkles className="h-5 w-5 text-green-500" />;
            case "warning":
                return <TrendingUp className="h-5 w-5 text-amber-500" />;
            case "error":
                return <X className="h-5 w-5 text-red-500" />;
            default:
                return <Lightbulb className="h-5 w-5 text-blue-500" />;
        }
    };

    const getPriorityStyles = () => {
        switch (notification.priority) {
            case "urgent":
                return "border-l-4 border-l-red-500 bg-red-500/5";
            case "high":
                return "border-l-4 border-l-amber-500 bg-amber-500/5";
            case "low":
                return "border-l-4 border-l-blue-500 bg-blue-500/5";
            default:
                return "border-l-4 border-l-purple-500 bg-purple-500/5";
        }
    };

    return (
        <div
            className={cn(
                "relative w-full max-w-sm rounded-xl border border-border bg-background p-4 shadow-lg animate-in slide-in-from-right duration-300",
                getPriorityStyles()
            )}
        >
            {/* Progress Bar */}
            {notification.priority !== "urgent" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-xl overflow-hidden">
                    <div
                        className="h-full bg-purple-500 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="flex gap-3">
                {/* Icon */}
                <div className="shrink-0 mt-0.5">{getIcon()}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
                        <button
                            onClick={onClose}
                            className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                    </p>

                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {notification.actions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleAction(action)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors",
                                        action.type === "complete" &&
                                        "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                                        action.type === "snooze" &&
                                        "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
                                        action.type === "dismiss" &&
                                        "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
                                        action.type === "link" &&
                                        "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
                                        action.type === "custom" &&
                                        "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                                    )}
                                >
                                    {action.type === "link" && <ExternalLink className="h-3 w-3" />}
                                    {action.type === "snooze" && <Clock className="h-3 w-3" />}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// Daily Summary Card Component
// ============================================

interface DailySummaryCardProps {
    completedTasks: number;
    totalTasks: number;
    focusMinutes: number;
    streak: number;
    achievements: number;
    onDismiss: () => void;
    onViewDetails: () => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
    completedTasks,
    totalTasks,
    focusMinutes,
    streak,
    achievements,
    onDismiss,
    onViewDetails,
}) => {
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-bold">Daily Summary</h3>
                </div>
                <button
                    onClick={onDismiss}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-green-500/5">
                    <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-500/5">
                    <p className="text-2xl font-bold text-purple-500">{focusMinutes}</p>
                    <p className="text-xs text-muted-foreground">Focus Min</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/5">
                    <p className="text-2xl font-bold text-amber-500">{streak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Task Completion</span>
                    <span className="font-medium">{completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* Achievements Badge */}
            {achievements > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/5 mb-4">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Achievements Unlocked!</p>
                        <p className="text-xs text-muted-foreground">
                            You earned {achievements} new badge{achievements > 1 ? "s" : ""} today
                        </p>
                    </div>
                </div>
            )}

            {/* Motivational Message */}
            <p className="text-sm text-center text-muted-foreground mb-4">
                {completionRate === 100
                    ? "🎉 Perfect day! You're unstoppable!"
                    : completionRate >= 75
                        ? "🌟 Amazing work! Almost there!"
                        : completionRate >= 50
                            ? "💪 Great progress! Keep it up!"
                            : "🚀 Every great day starts with a single step!"}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onDismiss}
                    className="flex-1 rounded-xl"
                >
                    Dismiss
                </Button>
                <Button
                    onClick={onViewDetails}
                    className="flex-1 rounded-xl bg-purple-500 hover:bg-purple-600"
                >
                    View Details
                </Button>
            </div>
        </div>
    );
};

// ============================================
// Notification Queue Manager
// ============================================

export const NotificationQueueManager: React.FC = () => {
    const { notifications, suppressUntil, isFocusModeActive } = useNotification();
    const [pendingNotifications, setPendingNotifications] = useState<AppNotification[]>([]);
    const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

    // Queue notifications when focus mode is active
    useEffect(() => {
        if (isFocusModeActive || (suppressUntil && suppressUntil > Date.now())) {
            // Queue unread notifications
            const unread = notifications.filter((n) => !n.read && n.priority !== "urgent");

            setPendingNotifications(prev => {
                // deep compare to avoid infinite loops if array reference changes but content matches
                const prevIds = prev.map(n => n.id).sort().join(',');
                const newIds = unread.map(n => n.id).sort().join(',');
                if (prevIds === newIds) return prev;
                return unread;
            });
        } else {
            // Release queued notifications
            setPendingNotifications(prev => {
                if (prev.length === 0) return prev;
                return [];
            });
        }
    }, [isFocusModeActive, suppressUntil, notifications]);

    // Show one notification at a time
    useEffect(() => {
        if (!activeToast && pendingNotifications.length > 0 && !isFocusModeActive && !(suppressUntil && suppressUntil > Date.now())) {
            const next = pendingNotifications[0];
            setActiveToast(next);
            setPendingNotifications((prev) => prev.slice(1));
        }
    }, [pendingNotifications, activeToast, isFocusModeActive, suppressUntil]);

    const handleToastClose = () => {
        setActiveToast(null);
    };

    if (activeToast) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <ActionableToast
                    notification={activeToast}
                    onClose={handleToastClose}
                />
            </div>
        );
    }

    return null;
};
