"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";

// ============================================
// Enhanced Notification Data Model
// ============================================

export type NotificationActionType = "complete" | "snooze" | "dismiss" | "link" | "custom";

export interface NotificationAction {
    id: string;
    label: string;
    type: NotificationActionType;
    value?: string; // For custom actions or links
    icon?: React.ReactNode;
}

export interface NotificationGroup {
    id: string;
    type: "task" | "achievement" | "system" | "social" | "daily_summary";
    title: string;
    notifications: AppNotification[];
    collapsed: boolean;
    timestamp: number;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    type?: "info" | "success" | "warning" | "error";
    link?: string;
    source?: "local" | "server";
    priority?: "low" | "normal" | "high" | "urgent";
    category?: "task" | "achievement" | "system" | "social" | "reminder" | "daily_summary";
    actions?: NotificationAction[];
    expiresAt?: number;
    groupId?: string;
}

// ============================================
// Enhanced Context Interface
// ============================================

interface NotificationContextType {
    notifications: AppNotification[];
    groupedNotifications: NotificationGroup[];
    unreadCount: number;
    unreadByCategory: Record<string, number>;
    isFocusModeActive: boolean;
    addNotification: (notification: Partial<AppNotification>) => string;
    addActionableNotification: (
        title: string,
        message: string,
        actions: NotificationAction[],
        options?: { type?: AppNotification["type"]; priority?: AppNotification["priority"]; category?: AppNotification["category"] }
    ) => string;
    markAsRead: (id: string) => void;
    markGroupAsRead: (groupId: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
    snoozeNotification: (id: string, minutes: number) => void;
    executeAction: (notificationId: string, actionId: string) => void;
    setFocusMode: (active: boolean) => void;
    getSmartSummary: () => Promise<string>;
    suppressUntil: number | null;
    setSuppressUntil: (timestamp: number | null) => void;
    focusMode: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ============================================
// Helper: Group Notifications
// ============================================

const groupNotifications = (notifications: AppNotification[]): NotificationGroup[] => {
    const groups: Record<string, AppNotification[]> = {};

    notifications.forEach((notification) => {
        const key = notification.category || notification.type || "general";
        if (!groups[key]) groups[key] = [];
        groups[key].push(notification);
    });

    return Object.entries(groups).map(([key, items]) => ({
        id: key,
        type: (items[0].category as NotificationGroup["type"]) || "system",
        title: getGroupTitle(key),
        notifications: items,
        collapsed: false,
        timestamp: Math.max(...items.map((n) => n.timestamp)),
    })).sort((a, b) => b.timestamp - a.timestamp);
};

const getGroupTitle = (key: string): string => {
    const titles: Record<string, string> = {
        task: "Tasks",
        achievement: "Achievements",
        system: "System",
        social: "Social",
        reminder: "Reminders",
        info: "Information",
        success: "Success",
        warning: "Warnings",
        error: "Errors",
        daily_summary: "Daily Summary",
    };
    return titles[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

// ============================================
// Notification Provider
// ============================================

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [groupedNotifications, setGroupedNotifications] = useState<NotificationGroup[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadByCategory, setUnreadByCategory] = useState<Record<string, number>>({});
    const [suppressUntil, setSuppressUntil] = useState<number | null>(null);
    const { user } = useAuth();
    const { isActive, isPaused, minutes } = useFocusTimer();
    const suppressRef = useRef<NodeJS.Timeout | null>(null);

    const isFocusModeActive = isActive && !isPaused;

    // Derived focus mode state
    const focusMode = !!(suppressUntil && suppressUntil > Date.now());

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("rt_notifications_history");
            if (stored) {
                const localNotifications: AppNotification[] = JSON.parse(stored).map((n: AppNotification) => ({
                    ...n,
                    source: "local" as const,
                }));
                setNotifications(localNotifications);
            }

            // Load suppress state
            const storedSuppressUntil = localStorage.getItem("rt_notifications_suppress_until");
            if (storedSuppressUntil) {
                const timestamp = parseInt(storedSuppressUntil);
                if (timestamp > Date.now()) {
                    setSuppressUntil(timestamp);
                }
            }
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }, []);

    // Auto-disable suppression when focus mode ends
    useEffect(() => {
        if (!isFocusModeActive && suppressUntil && suppressUntil > Date.now()) {
            setSuppressUntil(null);
            localStorage.removeItem("rt_notifications_suppress_until");
        }
    }, [isFocusModeActive, suppressUntil]);

    // Sync server notifications from Firestore
    useEffect(() => {
        if (!user) return;

        const notificationsRef = collection(db, "users", user.uid, "notifications");
        const q = query(notificationsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const serverNotifications: AppNotification[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                serverNotifications.push({
                    id: doc.id,
                    title: data.title,
                    message: data.message,
                    timestamp: new Date(data.createdAt?.seconds * 1000 || Date.now()).getTime(),
                    read: data.read || false,
                    type: data.type || "info",
                    source: "server",
                    priority: data.priority || "normal",
                    category: data.category,
                    actions: data.actions,
                });
            });

            setNotifications((prev) => {
                const localNotifications = prev.filter((n) => n.source === "local");
                const merged = [...serverNotifications, ...localNotifications];
                return merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
            });
        });

        return () => unsubscribe();
    }, [user]);

    // Update counts, groups, and persist whenever notifications change
    useEffect(() => {
        const unread = notifications.filter((n) => !n.read);
        setUnreadCount(unread.length);

        const categoryCounts: Record<string, number> = {};
        unread.forEach((n) => {
            const key = n.category || n.type || "general";
            categoryCounts[key] = (categoryCounts[key] || 0) + 1;
        });
        setUnreadByCategory(categoryCounts);

        // Group notifications
        const groups = groupNotifications(notifications);
        setGroupedNotifications(groups);

        // Persist to localStorage
        try {
            localStorage.setItem("rt_notifications_history", JSON.stringify(notifications.slice(0, 100)));
        } catch (e) {
            console.error("Failed to save notifications", e);
        }
    }, [notifications]);

    // Auto-suppress during focus mode
    // We only set this when focus mode starts or if the suppression has expired while still active.
    // We intentionally omit 'minutes' from dependencies to avoid updating on every timer tick.
    useEffect(() => {
        if (isFocusModeActive) {
            // Only update if we don't have a valid active suppression
            if (!suppressUntil || suppressUntil < Date.now()) {
                // Calculate expected end time based on current minutes (snapshot)
                const focusEndTime = Date.now() + (minutes * 60 * 1000) + 60000;
                setSuppressUntil(focusEndTime);
                localStorage.setItem("rt_notifications_suppress_until", focusEndTime.toString());
            }
        }
    }, [isFocusModeActive, suppressUntil]);

    // ============================================
    // Sound & Toast Helpers
    // ============================================

    const playSound = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            // Audio context might be blocked
        }
    }, []);

    const shouldShowToast = useCallback((notification: AppNotification): boolean => {
        // Don't show toast if notifications are suppressed
        if (suppressUntil && suppressUntil > Date.now()) {
            return false;
        }

        // Don't show toasts during focus mode (unless urgent)
        if (isFocusModeActive && notification.priority !== "urgent") {
            return false;
        }

        // Don't show expired notifications
        if (notification.expiresAt && notification.expiresAt < Date.now()) {
            return false;
        }

        return true;
    }, [suppressUntil, isFocusModeActive]);

    const showToast = useCallback((notification: AppNotification) => {
        if (!shouldShowToast(notification)) return;

        const toastId = toast(notification.title, {
            description: notification.message,
            duration: notification.priority === "urgent" ? 0 : 5000,
            style: {
                background: notification.priority === "urgent" ? "hsl(0 84% 60%)" : undefined,
            },
            action: notification.actions?.length ? {
                label: notification.actions[0].label,
                onClick: () => { },
            } : notification.link ? {
                label: "View",
                onClick: () => window.location.href = notification.link!,
            } : undefined,
        });
    }, [shouldShowToast]);

    // ============================================
    // Core Notification Methods
    // ============================================

    const addNotification = useCallback((notification: Partial<AppNotification>): string => {
        const newNotification: AppNotification = {
            id: notification.id || uuidv4(),
            title: notification.title || "Notification",
            message: notification.message || "",
            timestamp: Date.now(),
            read: false,
            type: notification.type || "info",
            link: notification.link,
            source: "local",
            priority: notification.priority || "normal",
            category: notification.category,
            actions: notification.actions,
            expiresAt: notification.expiresAt,
        };

        setNotifications((prev) => [newNotification, ...prev]);

        // Play sound and show toast
        playSound();
        showToast(newNotification);

        return newNotification.id;
    }, [playSound, showToast]);

    const addActionableNotification = useCallback((
        title: string,
        message: string,
        actions: NotificationAction[],
        options?: { type?: AppNotification["type"]; priority?: AppNotification["priority"]; category?: AppNotification["category"] }
    ): string => {
        const notification: Partial<AppNotification> = {
            title,
            message,
            type: options?.type || "info",
            priority: options?.priority || "normal",
            category: options?.category,
            actions,
        };

        return addNotification(notification);
    }, [addNotification]);

    const markAsRead = useCallback(async (id: string) => {
        const notification = notifications.find((n) => n.id === id);
        if (!notification) return;

        // Update Firestore if server notification
        if (notification.source === "server" && user) {
            try {
                await updateDoc(doc(db, "users", user.uid, "notifications", id), {
                    read: true
                });
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }

        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, [notifications, user]);

    const markGroupAsRead = useCallback((groupId: string) => {
        setNotifications((prev) =>
            prev.map((n) => {
                const group = groupedNotifications.find((g) => g.id === groupId);
                if (group?.notifications.some((gn) => gn.id === n.id)) {
                    return { ...n, read: true };
                }
                return n;
            })
        );
    }, [groupedNotifications]);

    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

        // Batch update Firestore for server notifications
        if (user && unreadIds.length > 0) {
            try {
                const batch = [];
                for (const id of unreadIds) {
                    const notification = notifications.find((n) => n.id === id);
                    if (notification?.source === "server") {
                        batch.push(updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true }));
                    }
                }
                await Promise.all(batch);
            } catch (error) {
                console.error("Failed to mark all as read", error);
            }
        }

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, [notifications, user]);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback(async (id: string) => {
        const notification = notifications.find((n) => n.id === id);
        if (!notification) return;

        // Delete from Firestore
        if (notification.source === "server" && user) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "notifications", id));
            } catch (error) {
                console.error("Failed to delete notification", error);
            }
        }

        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, [notifications, user]);

    const snoozeNotification = useCallback(async (id: string, minutes: number) => {
        const notification = notifications.find((n) => n.id === id);
        if (!notification) return;

        const snoozeUntil = Date.now() + minutes * 60 * 1000;

        // Update or create snoozed notification
        if (notification.source === "server" && user) {
            try {
                await setDoc(doc(db, "users", user.uid, "notifications", id), {
                    ...notification,
                    expiresAt: snoozeUntil,
                    read: true,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            } catch (error) {
                console.error("Failed to snooze notification", error);
            }
        }

        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true, expiresAt: snoozeUntil } : n))
        );

        // Re-add notification when snooze expires
        setTimeout(() => {
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === id ? { ...n, read: false, expiresAt: undefined } : n
                )
            );
        }, minutes * 60 * 1000);
    }, [notifications, user]);

    const executeAction = useCallback(async (notificationId: string, actionId: string) => {
        const notification = notifications.find((n) => n.id === notificationId);
        if (!notification) return;

        const action = notification.actions?.find((a) => a.id === actionId);
        if (!action) return;

        switch (action.type) {
            case "complete":
                // Handle completion action
                console.log("Executing complete action", action);
                break;
            case "snooze":
                if (action.value) {
                    snoozeNotification(notificationId, parseInt(action.value));
                }
                break;
            case "link":
                if (action.value) {
                    window.location.href = action.value;
                }
                break;
            case "dismiss":
                markAsRead(notificationId);
                break;
            case "custom":
                console.log("Custom action", action);
                break;
        }

        // Mark as read after action
        markAsRead(notificationId);
    }, [notifications, snoozeNotification, markAsRead]);

    const getSmartSummary = useCallback(async (): Promise<string> => {
        const unread = notifications.filter((n) => !n.read);
        if (unread.length === 0) return "You're all caught up! 🎉";

        const categories = Object.keys(unreadByCategory);
        const summaryParts: string[] = [];

        if (unreadByCategory.task) {
            summaryParts.push(`${unreadByCategory.task} task${unreadByCategory.task > 1 ? "s' updates" : "'s update"}`);
        }
        if (unreadByCategory.achievement) {
            summaryParts.push(`${unreadByCategory.achievement} new achievement${unreadByCategory.achievement > 1 ? "s" : ""}`);
        }
        if (unreadByCategory.reminder) {
            summaryParts.push(`${unreadByCategory.reminder} reminder${unreadByCategory.reminder > 1 ? "s" : ""}`);
        }

        if (summaryParts.length === 0) {
            return `${unread.length} new notification${unread.length > 1 ? "s" : ""}`;
        }

        return `You have ${summaryParts.join(", ")}`;
    }, [notifications, unreadByCategory]);

    // ============================================
    // Context Value
    // ============================================

    const contextValue = React.useMemo(() => ({
        notifications,
        groupedNotifications,
        unreadCount,
        unreadByCategory,
        isFocusModeActive,
        addNotification,
        addActionableNotification,
        markAsRead,
        markGroupAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
        snoozeNotification,
        executeAction,
        setFocusMode: (active: boolean) => {
            if (active) {
                const focusEndTime = Date.now() + (minutes * 60 * 1000) + 60000;
                setSuppressUntil(focusEndTime);
                localStorage.setItem("rt_notifications_suppress_until", focusEndTime.toString());
            } else {
                setSuppressUntil(null);
                localStorage.removeItem("rt_notifications_suppress_until");
            }
        },
        getSmartSummary,
        suppressUntil,
        setSuppressUntil,
        focusMode,
    }), [
        notifications,
        groupedNotifications,
        unreadCount,
        unreadByCategory,
        isFocusModeActive,
        addNotification,
        addActionableNotification,
        markAsRead,
        markGroupAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
        snoozeNotification,
        executeAction,
        getSmartSummary,
        suppressUntil,
        minutes,
        focusMode
    ]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};
