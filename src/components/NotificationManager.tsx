"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { useNotification, NotificationAction } from "@/context/NotificationContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { format, subMinutes, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, setDoc, query, where, writeBatch } from "firebase/firestore";

export const NotificationManager: React.FC = () => {
    const { tasks } = useTask();
    const { user } = useAuth();
    const { addNotification, addActionableNotification, suppressUntil, setFocusMode, focusMode } = useNotification();
    const { isActive: isTimerRunning, isPaused } = useFocusTimer();
    const notifiedTasks = useRef<Set<string>>(new Set());
    const scheduledNotifications = useRef<Set<string>>(new Set());
    const [lastSummaryDate, setLastSummaryDate] = useState<string | null>(null);

    // Check if focus mode should be active (timer running and not paused)
    const focusModeActive = isTimerRunning && !isPaused;

    // ============================================
    // Permission & Focus Mode Handling
    // ============================================

    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            const timeout = setTimeout(() => {
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        console.log("[Notifications] Permission granted");
                    }
                });
            }, 10000);
            return () => clearTimeout(timeout);
        }
    }, []);



    // ============================================
    // Notification Scheduling
    // ============================================

    const scheduleNotification = useCallback((title: string, body: string, scheduledTime: number, tag: string) => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({
                type: "SCHEDULE_NOTIFICATION",
                title,
                body,
                scheduledTime,
                tag,
            });
            console.log(`[Notifications] Scheduled: ${title} at ${new Date(scheduledTime).toLocaleTimeString()}`);
        });
    }, []);

    const showNotification = useCallback((title: string, body: string, tag: string, options?: { type?: "info" | "success" | "warning" | "error"; priority?: "low" | "normal" | "high" | "urgent" }) => {
        // Add to in-app notification center with proper options
        addNotification({
            title,
            message: body,
            type: options?.type || "info",
            priority: options?.priority || "normal",
            category: "reminder",
        });

        if (Notification.permission !== "granted") return;

        // Skip system notifications during focus mode (unless urgent)
        if (focusModeActive && options?.priority !== "urgent") {
            console.log("[Notifications] Suppressed during focus mode:", title);
            return;
        }

        // Try service worker first (for offline support)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body,
                    icon: "/logo.jpg",
                    badge: "/icon-192.png",
                    tag,
                    requireInteraction: options?.priority === "urgent",
                });
            });
        } else {
            new Notification(title, { body, icon: "/logo.jpg", tag });
        }
    }, [addNotification, focusModeActive]);

    // ============================================
    // Task Notifications
    // ============================================

    // Schedule upcoming task notifications
    useEffect(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;

        let notificationsEnabled = false;
        try {
            notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
        } catch (e) { }

        if (!notificationsEnabled) return;
        if (tasks.length === 0) return;

        const now = new Date();
        const todayStr = format(now, "EEE").toUpperCase();
        const todayDateStr = format(now, "yyyy-MM-dd");

        tasks.forEach(task => {
            const isCompletedToday = task.completionHistory?.includes(todayDateStr);
            if (!task.days.includes(todayStr) || isCompletedToday) return;

            const [hours, mins] = task.startTime.split(":").map(Number);
            const taskStartTime = new Date(now);
            taskStartTime.setHours(hours, mins, 0, 0);

            if (isBefore(taskStartTime, now)) return;

            if (task.reminder) {
                let reminderMinutes = 0;
                if (task.reminder.endsWith("m")) reminderMinutes = parseInt(task.reminder);
                else if (task.reminder.endsWith("h")) reminderMinutes = parseInt(task.reminder) * 60;

                const reminderTime = subMinutes(taskStartTime, reminderMinutes);
                const reminderId = `${task.id}-reminder-${todayDateStr}`;

                if (isAfter(reminderTime, now) && !scheduledNotifications.current.has(reminderId)) {
                    scheduleNotification(
                        `⏰ Upcoming: ${task.title}`,
                        `Starting in ${task.reminder} at ${task.startTime}`,
                        reminderTime.getTime(),
                        reminderId
                    );
                    scheduledNotifications.current.add(reminderId);
                }
            }

            const startId = `${task.id}-start-${todayDateStr}`;
            if (!scheduledNotifications.current.has(startId)) {
                scheduleNotification(
                    `🎯 Time for ${task.title}!`,
                    `Your ${task.timeBlock} task is starting now.`,
                    taskStartTime.getTime(),
                    startId
                );
                scheduledNotifications.current.add(startId);
            }
        });
    }, [tasks, scheduleNotification]);

    // Real-time fallback for task notifications
    useEffect(() => {
        const checkTasks = () => {
            if (Notification.permission !== "granted") return;
            if (focusModeActive) return; // Skip during focus mode

            let notificationsEnabled = false;
            try {
                notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
            } catch (error) { }
            if (!notificationsEnabled) return;

            const now = new Date();
            const todayStr = format(now, "EEE").toUpperCase();
            const todayDateStr = format(now, "yyyy-MM-dd");

            tasks.forEach(task => {
                const isCompletedToday = task.completionHistory?.includes(todayDateStr);
                if (!task.days.includes(todayStr) || isCompletedToday) return;

                const [hours, mins] = task.startTime.split(":").map(Number);
                const taskStartTime = new Date(now);
                taskStartTime.setHours(hours, mins, 0, 0);

                const startId = `${task.id}-start-${todayDateStr}`;
                if (isAfter(now, taskStartTime) && isBefore(now, addMinutes(taskStartTime, 2)) && !notifiedTasks.current.has(startId)) {
                    showNotification(`🎯 Time for ${task.title}!`, `Your ${task.timeBlock} task is starting now.`, startId, {
                        type: "info",
                        priority: "high",
                    });
                    notifiedTasks.current.add(startId);
                }
            });
        };

        const interval = setInterval(checkTasks, 30000);
        checkTasks();
        return () => clearInterval(interval);
    }, [tasks, showNotification, focusModeActive]);

    // ============================================
    // Server Reminders
    // ============================================

    useEffect(() => {
        const checkServerReminders = async () => {
            if (!user) return;
            if (Notification.permission !== "granted") return;
            if (focusModeActive) return;

            let notificationsEnabled = false;
            try {
                notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
            } catch (e) { }
            if (!notificationsEnabled) return;

            try {
                const now = new Date();
                const currentTime = format(now, "HH:mm");

                const remindersSnapshot = await getDocs(
                    collection(db, "users", user.uid, "scheduledReminders")
                );

                for (const reminderDoc of remindersSnapshot.docs) {
                    const reminder = reminderDoc.data();

                    if (reminder.delivered) continue;

                    if (reminder.reminderTime <= currentTime && !notifiedTasks.current.has(reminderDoc.id)) {
                        showNotification(
                            `⏰ Upcoming: ${reminder.taskTitle}`,
                            `${reminder.taskIcon} Starting at ${reminder.startTime}`,
                            `reminder-${reminderDoc.id}`,
                            { type: "info", priority: "normal" }
                        );
                        notifiedTasks.current.add(reminderDoc.id);

                        await updateDoc(doc(db, "users", user.uid, "scheduledReminders", reminderDoc.id), {
                            delivered: true,
                        });
                    }
                }
            } catch (error) {
                console.error("[Notifications] Failed to check server reminders:", error);
            }
        };

        if (user) {
            const interval = setInterval(checkServerReminders, 60000);
            checkServerReminders();
            return () => clearInterval(interval);
        }
    }, [user, showNotification, focusModeActive]);

    // ============================================
    // Daily Summary & Motivation
    // ============================================

    useEffect(() => {
        const sendDailyMotivation = async () => {
            if (!user) return;

            let notificationsEnabled = false;
            let lastMotivationDate = null;
            try {
                notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
                lastMotivationDate = localStorage.getItem("lastMotivationDate");
            } catch (error) { }

            if (!notificationsEnabled) return;

            const today = format(new Date(), "yyyy-MM-dd");
            if (lastMotivationDate === today) return;

            const offlineMotivations = [
                "Consistency is key! Your unexpected journey starts with a single step.",
                "You are capable of amazing things. Keep pushing!",
                "Small progress is still progress. Keep going!",
                "Your potential is endless. Go do what you were created to do.",
                "Discipline is choosing between what you want now and what you want most.",
            ];

            try {
                if (!navigator.onLine) {
                    const randomMsg = offlineMotivations[Math.floor(Math.random() * offlineMotivations.length)];
                    addNotification({
                        title: "Daily Motivation ✨",
                        message: randomMsg,
                        type: "success",
                        category: "system",
                    });
                    localStorage.setItem("lastMotivationDate", today);
                    return;
                }

                const todayStr = format(new Date(), "EEE").toUpperCase();
                const todayTasks = tasks.filter(t => t.days?.includes(todayStr));

                const response = await fetch("/api/ai/motivation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tasks: todayTasks.slice(0, 5),
                        userName: user.displayName || user.email?.split("@")[0],
                    }),
                });

                if (!response.ok) throw new Error("API Failed");

                const data = await response.json();

                if (data.motivation) {
                    addNotification({
                        title: "Daily Motivation ✨",
                        message: data.motivation,
                        type: "success",
                        category: "system",
                    });
                    localStorage.setItem("lastMotivationDate", today);
                }
            } catch (error) {
                console.error("Failed to get motivation:", error);
                const randomMsg = offlineMotivations[Math.floor(Math.random() * offlineMotivations.length)];
                addNotification({
                    title: "Daily Motivation ✨",
                    message: randomMsg,
                    type: "success",
                    category: "system",
                });
                try {
                    localStorage.setItem("lastMotivationDate", today);
                } catch (e) { }
            }
        };

        const timeout = setTimeout(sendDailyMotivation, 5000);
        return () => clearTimeout(timeout);
    }, [tasks, user, addNotification]);

    // ============================================
    // Smart Daily Summary
    // ============================================

    useEffect(() => {
        const generateDailySummary = async () => {
            if (!user) return;
            if (focusModeActive) return;

            const today = format(new Date(), "yyyy-MM-dd");
            let storedLastSummaryDate = lastSummaryDate;

            // Check localStorage
            try {
                const stored = localStorage.getItem("lastSummaryDate");
                if (stored) storedLastSummaryDate = stored;
            } catch (e) { }

            if (storedLastSummaryDate === today) {
                if (lastSummaryDate !== today) setLastSummaryDate(today); // Sync state
                return;
            }

            let notificationsEnabled = false;
            try {
                notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
            } catch (e) { }
            if (!notificationsEnabled) return;

            // Generate summary at 8 PM
            const now = new Date();
            const currentHour = now.getHours();
            if (currentHour < 20) return; // Only generate after 8 PM

            try {
                // Get today's completed tasks
                const todayStr = format(now, "EEE").toUpperCase();
                const todayTasks = tasks.filter(t => t.days?.includes(todayStr));
                const completedTasks = todayTasks.filter(t =>
                    t.completionHistory?.includes(today)
                );

                // Create summary actions
                const summaryActions: NotificationAction[] = [
                    {
                        id: "view-details",
                        label: "View Details",
                        type: "link",
                        value: "/analytics",
                    },
                    {
                        id: "dismiss",
                        label: "Dismiss",
                        type: "dismiss",
                    },
                ];

                if (completedTasks.length > 0) {
                    addActionableNotification(
                        "Daily Summary 🌟",
                        `Great work today! You completed ${completedTasks.length} of ${todayTasks.length} tasks. ${completedTasks.length === todayTasks.length
                            ? "Perfect day! 🎉"
                            : "Keep up the momentum!"
                        }`,
                        summaryActions,
                        { type: "success", category: "daily_summary" }
                    );
                }

                setLastSummaryDate(today);
                localStorage.setItem("lastSummaryDate", today);
            } catch (error) {
                console.error("Failed to generate daily summary:", error);
            }
        };

        // Check every hour for summary time
        const interval = setInterval(generateDailySummary, 3600000);
        generateDailySummary();
        return () => clearInterval(interval);
    }, [tasks, user, lastSummaryDate, addActionableNotification, focusModeActive]);

    // ============================================
    // Achievement Notifications
    // ============================================

    // Listen for achievement unlocks and notify
    useEffect(() => {
        if (!user) return;

        // This would typically be triggered by the achievement system
        // For now, we'll leave this as a hook for future integration
        console.log("[Notifications] Achievement listener ready");
    }, [user]);

    return null;
};
