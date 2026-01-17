"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    Bell,
    X,
    Check,
    Trash2,
    Info,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Clock,
    Sparkles,
    Zap,
    Calendar,
    Minimize2,
    Maximize2,
} from "lucide-react";
import { useNotification, AppNotification, NotificationAction } from "@/context/NotificationContext";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

export const NotificationCenter: React.FC = () => {
    const {
        notifications,
        groupedNotifications,
        unreadCount,
        unreadByCategory,
        markAsRead,
        markGroupAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
        executeAction,
        isFocusModeActive,
        suppressUntil,
        getSmartSummary,
    } = useNotification();

    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grouped" | "list">("grouped");
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Smart summary state
    const [smartSummary, setSmartSummary] = useState<string>("");
    useEffect(() => {
        getSmartSummary().then(setSmartSummary);
    }, [notifications, getSmartSummary]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get icon based on notification type
    const getIcon = (type: AppNotification["type"]) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case "error":
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    // Get category icon
    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case "task":
                return <Zap className="h-4 w-4 text-amber-500" />;
            case "achievement":
                return <Sparkles className="h-4 w-4 text-purple-500" />;
            case "reminder":
                return <Clock className="h-4 w-4 text-blue-500" />;
            case "system":
                return <Info className="h-4 w-4 text-gray-500" />;
            case "social":
                return <Bell className="h-4 w-4 text-pink-500" />;
            default:
                return null;
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: number) => {
        if (isToday(timestamp)) {
            return format(timestamp, "h:mm a");
        } else if (isYesterday(timestamp)) {
            return `Yesterday ${format(timestamp, "h:mm a")}`;
        }
        return format(timestamp, "MMM d, h:mm a");
    };

    // Toggle group collapse
    const toggleGroup = (groupId: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    // Handle action click
    const handleActionClick = (notificationId: string, action: NotificationAction, e: React.MouseEvent) => {
        e.stopPropagation();
        executeAction(notificationId, action.id);
    };

    // Calculate total unread in collapsed groups
    const collapsedUnreadCount = useMemo(() => {
        return groupedNotifications
            .filter((g) => collapsedGroups.has(g.id))
            .reduce((sum, g) => sum + g.notifications.filter((n) => !n.read).length, 0);
    }, [groupedNotifications, collapsedGroups]);

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative rounded-xl transition-all",
                    isOpen ? "bg-muted text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
            >
                <Bell
                    className={cn(
                        "h-6 w-6 transition-transform",
                        isOpen && "rotate-12",
                        isFocusModeActive && "text-purple-500"
                    )}
                />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                )}
                {suppressUntil && suppressUntil > Date.now() && (
                    <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-1 ring-background" />
                )}
            </Button>

            {isOpen && (
                <div
                    className="fixed inset-x-4 top-24 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 w-auto md:w-[28rem] rounded-3xl border border-border bg-background/95 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top md:origin-top-right"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-500">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* View Mode Toggle */}
                            <div className="flex bg-muted/50 rounded-lg p-0.5 mr-2">
                                <button
                                    onClick={() => setViewMode("grouped")}
                                    className={cn(
                                        "px-2 py-1 rounded-md text-xs font-medium transition-colors",
                                        viewMode === "grouped"
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Grouped
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={cn(
                                        "px-2 py-1 rounded-md text-xs font-medium transition-colors",
                                        viewMode === "list"
                                            ? "bg-background shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    List
                                </button>
                            </div>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    title="Mark all as read"
                                >
                                    <Check className="h-4 w-4 mr-1" /> Mark all
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAll}
                                    className="h-8 text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                    title="Clear all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Smart Summary Banner */}
                    {smartSummary && unreadCount > 0 && (
                        <div className="px-4 py-2 bg-purple-500/5 border-b border-border/30">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                ✨ {smartSummary}
                            </p>
                        </div>
                    )}

                    {/* Focus Mode Indicator */}
                    {isFocusModeActive && (
                        <div className="px-4 py-2 bg-amber-500/10 border-b border-border/30 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                Focus Mode active - Notifications suppressed
                            </span>
                        </div>
                    )}

                    {/* Notification List */}
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                <p className="text-sm font-medium text-foreground">No notifications</p>
                                <p className="text-xs text-muted-foreground">You're all caught up!</p>
                            </div>
                        ) : viewMode === "grouped" ? (
                            <div className="divide-y divide-border/30">
                                {groupedNotifications.map((group) => {
                                    const groupUnread = group.notifications.filter((n) => !n.read).length;
                                    const isCollapsed = collapsedGroups.has(group.id);

                                    return (
                                        <div key={group.id}>
                                            {/* Group Header */}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleGroup(group.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleGroup(group.id);
                                                    }
                                                }}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                            >
                                                <div className="shrink-0">
                                                    {getCategoryIcon(group.type) || <Bell className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-foreground">
                                                            {group.title}
                                                        </span>
                                                        {groupUnread > 0 && (
                                                            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-500">
                                                                {groupUnread}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {group.notifications.length} notification{group.notifications.length > 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {groupUnread > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markGroupAsRead(group.id);
                                                            }}
                                                            className="h-6 px-2 text-[10px] text-purple-500 hover:text-purple-600"
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Read all
                                                        </Button>
                                                    )}
                                                    {isCollapsed ? (
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Group Notifications */}
                                            {!isCollapsed && (
                                                <div className="bg-muted/10 divide-y divide-border/20">
                                                    {group.notifications.slice(0, 5).map((notification) => (
                                                        <NotificationItem
                                                            key={notification.id}
                                                            notification={notification}
                                                            onMarkAsRead={markAsRead}
                                                            onRemove={removeNotification}
                                                            onAction={handleActionClick}
                                                            formatTimestamp={formatTimestamp}
                                                            getIcon={getIcon}
                                                        />
                                                    ))}
                                                    {group.notifications.length > 5 && (
                                                        <div className="p-3 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-xs text-muted-foreground hover:text-foreground"
                                                            >
                                                                View {group.notifications.length - 5} more
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                        onRemove={removeNotification}
                                        onAction={handleActionClick}
                                        formatTimestamp={formatTimestamp}
                                        getIcon={getIcon}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// Notification Item Component
// ============================================

interface NotificationItemProps {
    notification: AppNotification;
    onMarkAsRead: (id: string) => void;
    onRemove: (id: string) => void;
    onAction: (notificationId: string, action: NotificationAction, e: React.MouseEvent) => void;
    formatTimestamp: (timestamp: number) => string;
    getIcon: (type: AppNotification["type"]) => React.ReactNode;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onRemove,
    onAction,
    formatTimestamp,
    getIcon,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={cn(
                "group relative flex gap-4 p-4 transition-colors hover:bg-muted/40",
                !notification.read && "bg-purple-500/5 hover:bg-purple-500/10"
            )}
        >
            {/* Icon */}
            <div className="mt-1 shrink-0">{getIcon(notification.type || "info")}</div>

            {/* Content */}
            <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <p
                        className={cn(
                            "text-sm font-medium leading-none",
                            !notification.read ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatTimestamp(notification.timestamp)}
                    </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                    {isExpanded ? notification.message : notification.message.slice(0, 100)}
                    {notification.message.length > 100 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-1 text-purple-500 hover:underline"
                        >
                            {isExpanded ? "Show less" : "Show more"}
                        </button>
                    )}
                </p>

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                        {notification.actions.slice(0, 3).map((action) => (
                            <button
                                key={action.id}
                                onClick={(e) => onAction(notification.id, action, e)}
                                className={cn(
                                    "px-2 py-1 text-[10px] font-medium rounded-md transition-colors",
                                    action.type === "complete" &&
                                    "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                                    action.type === "snooze" &&
                                    "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
                                    action.type === "dismiss" &&
                                    "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20",
                                    action.type === "link" &&
                                    "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                )}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                        <button
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-[10px] font-medium text-purple-500 hover:underline"
                        >
                            Mark as read
                        </button>
                    )}
                    <button
                        onClick={() => onRemove(notification.id)}
                        className="text-[10px] font-medium text-red-500 hover:underline"
                    >
                        Remove
                    </button>
                </div>
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-purple-500" />
            )}
        </div>
    );
};
