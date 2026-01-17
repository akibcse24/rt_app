"use client";

import React, { useState, useEffect } from "react";
import {
    Bell,
    BellOff,
    Smartphone,
    RefreshCw,
    Clock,
    Settings,
    Check,
    ChevronRight,
    Zap,
} from "lucide-react";
import { usePushNotification } from "@/hooks/usePushNotification";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

interface PushNotificationSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
    isOpen,
    onClose
}) => {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe
    } = usePushNotification();

    const [settings, setSettings] = useState({
        taskReminders: true,
        dailySummary: true,
        achievements: true,
        streaks: true,
        backgroundSync: true,
        silentPush: true
    });

    // Load settings from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem("rt_push_settings");
            if (stored) {
                setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
            }
        } catch (e) {
            console.error("Failed to load push settings", e);
        }
    }, []);

    // Save settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("rt_push_settings", JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save push settings", e);
        }
    }, [settings]);

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
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold">Push Notifications</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Status Section */}
                    <div className="p-4 border-b border-border/30">
                        {!isSupported ? (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                                <Smartphone className="h-8 w-8 text-red-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-red-500">Not Supported</p>
                                <p className="text-xs text-muted-foreground">
                                    Your browser doesn't support push notifications
                                </p>
                            </div>
                        ) : permission === "denied" ? (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <BellOff className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-amber-500">Permission Denied</p>
                                <p className="text-xs text-muted-foreground">
                                    Please enable notifications in your browser settings
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={isSubscribed ? unsubscribe : subscribe}
                                disabled={isLoading}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-xl transition-all",
                                    isSubscribed
                                        ? "bg-green-500/5 border border-green-500/20 hover:bg-green-500/10"
                                        : "bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {isSubscribed ? (
                                        <Bell className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <BellOff className="h-5 w-5 text-amber-500" />
                                    )}
                                    <div className="text-left">
                                        <p className="text-sm font-medium">
                                            {isLoading
                                                ? "Loading..."
                                                : isSubscribed
                                                ? "Push Notifications Active"
                                                : "Enable Push Notifications"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isSubscribed
                                                ? "You'll receive notifications on this device"
                                                : "Click to enable notifications"}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative",
                                        isSubscribed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                            isSubscribed ? "left-7" : "left-1"
                                        )}
                                    />
                                </div>
                            </button>
                        )}
                        {error && (
                            <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
                        )}
                    </div>

                    {/* Notification Types */}
                    {isSubscribed && (
                        <div className="p-4 border-b border-border/30">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Notification Types
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => toggleSetting("taskReminders")}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Task Reminders</p>
                                            <p className="text-xs text-muted-foreground">
                                                Get notified about scheduled tasks
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-colors relative",
                                            settings.taskReminders
                                                ? "bg-purple-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                                settings.taskReminders ? "left-5" : "left-0.5"
                                            )}
                                        />
                                    </div>
                                </button>

                                <button
                                    onClick={() => toggleSetting("dailySummary")}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="h-5 w-5 text-blue-500" />
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
                                            settings.dailySummary
                                                ? "bg-purple-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                                settings.dailySummary ? "left-5" : "left-0.5"
                                            )}
                                        />
                                    </div>
                                </button>

                                <button
                                    onClick={() => toggleSetting("achievements")}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Zap className="h-5 w-5 text-purple-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Achievements</p>
                                            <p className="text-xs text-muted-foreground">
                                                Achievement unlocks and progress
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-colors relative",
                                            settings.achievements
                                                ? "bg-purple-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                                settings.achievements ? "left-5" : "left-0.5"
                                            )}
                                        />
                                    </div>
                                </button>

                                <button
                                    onClick={() => toggleSetting("streaks")}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-green-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Streak Alerts</p>
                                            <p className="text-xs text-muted-foreground">
                                                Streak milestones and reminders
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-colors relative",
                                            settings.streaks
                                                ? "bg-purple-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                                settings.streaks ? "left-5" : "left-0.5"
                                            )}
                                        />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Background Sync Settings */}
                    {isSubscribed && (
                        <div className="p-4 border-b border-border/30">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                Background Sync
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => toggleSetting("backgroundSync")}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="h-5 w-5 text-indigo-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Background Sync</p>
                                            <p className="text-xs text-muted-foreground">
                                                Sync data even when app is closed
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-colors relative",
                                            settings.backgroundSync
                                                ? "bg-purple-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                                settings.backgroundSync ? "left-5" : "left-0.5"
                                            )}
                                        />
                                    </div>
                                </button>

                                <button
                                    onClick={() => toggleSetting("silentPush")}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <BellOff className="h-5 w-5 text-gray-500" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Silent Push</p>
                                            <p className="text-xs text-muted-foreground">
                                                Quiet background updates without alerts
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-10 h-5 rounded-full transition-colors relative",
                                            settings.silentPush
                                                ? "bg-purple-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                                                settings.silentPush ? "left-5" : "left-0.5"
                                            )}
                                        />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="p-4">
                        <div className="p-3 rounded-xl bg-muted/30">
                            <p className="text-xs text-muted-foreground text-center">
                                Push notifications require an active internet connection
                                and work best on supported browsers (Chrome, Firefox, Safari).
                            </p>
                        </div>
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

// ============================================================================
// PUSH NOTIFICATION BADGE COMPONENT
// ============================================================================

export const PushNotificationBadge: React.FC = () => {
    const { isSupported, isSubscribed, permission, subscribe } = usePushNotification();

    if (!isSupported || permission === "denied") return null;

    return (
        <button
            onClick={subscribe}
            className={cn(
                "relative p-2 rounded-xl transition-colors",
                isSubscribed
                    ? "text-green-500 hover:bg-green-500/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={isSubscribed ? "Push notifications enabled" : "Enable push notifications"}
        >
            {isSubscribed ? (
                <Bell className="h-5 w-5" />
            ) : (
                <BellOff className="h-5 w-5" />
            )}
        </button>
    );
};

export default PushNotificationSettings;
