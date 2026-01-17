"use client";

import React, { useState, useEffect } from "react";
import {
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Moon,
    Sun,
    Smartphone,
    Zap,
    Clock,
    Settings,
    Check,
    ChevronRight,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
    const {
        suppressUntil,
        setSuppressUntil,
        isFocusModeActive,
        unreadByCategory,
    } = useNotification();

    const [settings, setSettings] = useState({
        enabled: true,
        sound: true,
        desktop: true,
        focusMode: true,
        dailySummary: true,
        taskReminders: true,
        achievements: true,
        motivation: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
    });

    // Load settings from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem("rt_notification_settings");
            if (stored) {
                setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
            }
        } catch (e) {
            console.error("Failed to load notification settings", e);
        }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("rt_notification_settings", JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save notification settings", e);
        }
    }, [settings]);

    // Update global notification enabled state
    useEffect(() => {
        localStorage.setItem("rt_notifications_enabled", settings.enabled ? "true" : "false");
    }, [settings.enabled]);

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold">Notification Settings</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Master Toggle */}
                    <div className="p-4 border-b border-border/30">
                        <button
                            onClick={() => toggleSetting("enabled")}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {settings.enabled ? (
                                    <Bell className="h-5 w-5 text-green-500" />
                                ) : (
                                    <BellOff className="h-5 w-5 text-red-500" />
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-medium">Notifications</p>
                                    <p className="text-xs text-muted-foreground">
                                        {settings.enabled ? "Enabled" : "Disabled"}
                                    </p>
                                </div>
                            </div>
                            <div
                                className={cn(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    settings.enabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                        settings.enabled ? "left-7" : "left-1"
                                    )}
                                />
                            </div>
                        </button>
                    </div>

                    {/* Sound & Desktop */}
                    <div className="p-4 border-b border-border/30">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                            Appearance
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => toggleSetting("sound")}
                                disabled={!settings.enabled}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    {settings.sound ? (
                                        <Volume2 className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <VolumeX className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Sound</p>
                                        <p className="text-xs text-muted-foreground">
                                            Play sounds for notifications
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        settings.sound && settings.enabled
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                            settings.sound && settings.enabled ? "left-5" : "left-0.5"
                                        )}
                                    />
                                </div>
                            </button>

                            <button
                                onClick={() => toggleSetting("desktop")}
                                disabled={!settings.enabled}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Desktop Notifications</p>
                                        <p className="text-xs text-muted-foreground">
                                            Show browser notifications
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        settings.desktop && settings.enabled
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                            settings.desktop && settings.enabled ? "left-5" : "left-0.5"
                                        )}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Notification Types */}
                    <div className="p-4 border-b border-border/30">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                            Notification Types
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => toggleSetting("taskReminders")}
                                disabled={!settings.enabled}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Task Reminders</p>
                                        <p className="text-xs text-muted-foreground">
                                            Remind about scheduled tasks
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        settings.taskReminders && settings.enabled
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                            settings.taskReminders && settings.enabled ? "left-5" : "left-0.5"
                                        )}
                                    />
                                </div>
                            </button>

                            <button
                                onClick={() => toggleSetting("achievements")}
                                disabled={!settings.enabled}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Achievements</p>
                                        <p className="text-xs text-muted-foreground">
                                            Unlock and progress updates
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        settings.achievements && settings.enabled
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                            settings.achievements && settings.enabled ? "left-5" : "left-0.5"
                                        )}
                                    />
                                </div>
                            </button>

                            <button
                                onClick={() => toggleSetting("motivation")}
                                disabled={!settings.enabled}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Sun className="h-5 w-5 text-orange-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Daily Motivation</p>
                                        <p className="text-xs text-muted-foreground">
                                            Morning inspiration messages
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        settings.motivation && settings.enabled
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                            settings.motivation && settings.enabled ? "left-5" : "left-0.5"
                                        )}
                                    />
                                </div>
                            </button>

                            <button
                                onClick={() => toggleSetting("dailySummary")}
                                disabled={!settings.enabled}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <Moon className="h-5 w-5 text-indigo-500" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">Daily Summary</p>
                                        <p className="text-xs text-muted-foreground">
                                            Evening progress recap
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-colors relative",
                                        settings.dailySummary && settings.enabled
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                            settings.dailySummary && settings.enabled ? "left-5" : "left-0.5"
                                        )}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Focus Mode */}
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                            Focus Mode
                        </h3>
                        <button
                            onClick={() => toggleSetting("focusMode")}
                            disabled={!settings.enabled}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-purple-500" />
                                <div className="text-left">
                                    <p className="text-sm font-medium">Auto-Suppress</p>
                                    <p className="text-xs text-muted-foreground">
                                        Silence notifications during focus sessions
                                    </p>
                                </div>
                            </div>
                            <div
                                className={cn(
                                    "w-10 h-5 rounded-full transition-colors relative",
                                    settings.focusMode && settings.enabled
                                        ? "bg-purple-500"
                                        : "bg-gray-300 dark:bg-gray-600"
                                )}
                            >
                                <div
                                    className={cn(
                                        "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                        settings.focusMode && settings.enabled ? "left-5" : "left-0.5"
                                    )}
                                />
                            </div>
                        </button>

                        {/* Focus Mode Status */}
                        {isFocusModeActive && (
                            <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-500 animate-pulse" />
                                    <span className="text-sm font-medium text-purple-500">
                                        Focus Mode Active
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Notifications are currently suppressed
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 bg-muted/20">
                    <Button
                        onClick={onClose}
                        className="w-full rounded-xl"
                        size="lg"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// Notification Badge Component
// ============================================

export const NotificationBadge: React.FC<{ showSettings?: boolean }> = ({ showSettings = true }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { unreadCount, suppressUntil } = useNotification();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            <div
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Settings Gear */}
                {showSettings && isHovered && unreadCount === 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSettingsOpen(true)}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-muted hover:bg-muted/80"
                    >
                        <Settings className="h-3 w-3" />
                    </Button>
                )}

                {/* Main Notification Icon */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSettingsOpen(true)}
                    className={cn(
                        "rounded-xl transition-all",
                        suppressUntil && suppressUntil > Date.now()
                            ? "text-amber-500"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                    )}
                    {suppressUntil && suppressUntil > Date.now() && (
                        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-1 ring-background" />
                    )}
                </Button>
            </div>

            <NotificationSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
    );
};
