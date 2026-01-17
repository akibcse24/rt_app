// ============================================================================
// PUSH NOTIFICATION MANAGER
// ============================================================================
// This component manages:
// 1. Push subscription lifecycle
// 2. Background sync triggers
// 3. Silent push handling
// 4. Push event listeners

"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePushNotification } from "@/hooks/usePushNotification";
import { useTask } from "@/context/TaskContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const PushNotificationManager: React.FC = () => {
    const { user } = useAuth();
    const { isSubscribed, isSupported, subscribe, checkSubscriptionStatus } = usePushNotification();
    const { tasks } = useTask();
    const messageListenerRef = useRef<(() => void) | null>(null);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ============================================================================
    // SERVICE WORKER MESSAGING
    // ============================================================================

    // Listen for messages from service worker
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const handleMessage = (event: MessageEvent) => {
            console.log("[PushManager] Message from SW:", event.data);
            
            switch (event.data.type) {
                case "task-complete":
                    handleTaskComplete(event.data);
                    break;
                case "task-snooze":
                    handleTaskSnooze(event.data);
                    break;
                case "sync-complete":
                    console.log("[PushManager] Background sync complete");
                    break;
                default:
                    console.log("[PushManager] Unknown message type:", event.data.type);
            }
        };

        navigator.serviceWorker.addEventListener("message", handleMessage);

        return () => {
            navigator.serviceWorker.removeEventListener("message", handleMessage);
        };
    }, []);

    // ============================================================================
    // AUTO-SUBSCRIBE WHEN USER LOGS IN
    // ============================================================================

    useEffect(() => {
        if (user && isSupported && !isSubscribed) {
            // Auto-subscribe to push notifications
            const autoSubscribe = async () => {
                // Only auto-subscribe if user has previously granted permission
                if (Notification.permission === "granted") {
                    await subscribe();
                }
            };
            autoSubscribe();
        }
    }, [user, isSupported, isSubscribed, subscribe]);

    // ============================================================================
    // BACKGROUND SYNC SETUP
    // ============================================================================

    // Set up periodic background sync
    useEffect(() => {
        if (!isSubscribed || !("serviceWorker" in navigator)) return;

        const setupBackgroundSync = async () => {
            const registration = await navigator.serviceWorker.ready;
            
            // Register for periodic background sync if supported
            if ("periodicSync" in registration) {
                try {
                    await (registration as any).periodicSync.register("sync-tasks", {
                        minInterval: 15 * 60 * 1000 // 15 minutes
                    });
                    console.log("[PushManager] Periodic background sync registered");
                } catch (error) {
                    console.log("[PushManager] Periodic sync not available:", error);
                }
            }
        };

        setupBackgroundSync();

        // Set up manual sync interval as fallback
        syncIntervalRef.current = setInterval(() => {
            triggerBackgroundSync();
        }, 30 * 60 * 1000); // Every 30 minutes

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [isSubscribed]);

    // ============================================================================
    // SYNC TRIGGERS
    // ============================================================================

    const triggerBackgroundSync = useCallback(async () => {
        if (!user || !isSubscribed) return;

        try {
            console.log("[PushManager] Triggering background sync");
            
            // Update last sync timestamp
            const userRef = doc(db, "users", user.uid, "preferences", "sync");
            await updateDoc(userRef, {
                lastBackgroundSync: serverTimestamp(),
                syncInProgress: true
            });
            
            // The service worker will handle the actual sync
            const registration = await navigator.serviceWorker.ready;
            
            registration.active?.postMessage({
                type: "TRIGGER_BACKGROUND_SYNC",
                data: {
                    userId: user.uid,
                    timestamp: Date.now()
                }
            });
            
        } catch (error) {
            console.error("[PushManager] Failed to trigger background sync:", error);
        }
    }, [user, isSubscribed]);

    const handleTaskComplete = useCallback((data: { taskId: string }) => {
        console.log("[PushManager] Task completed from notification:", data.taskId);
        // This would be handled by the TaskContext
    }, []);

    const handleTaskSnooze = useCallback((data: { taskId: string; duration: number }) => {
        console.log("[PushManager] Task snoozed:", data.taskId, `for ${data.duration} minutes`);
        // This would be handled by the TaskContext
    }, []);

    // ============================================================================
    // PERIODIC SYNC EVENT HANDLER (Service Worker)
    // ============================================================================

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const handlePeriodicSync = async (event: any) => {
            if (event.tag === "sync-tasks") {
                console.log("[PushManager] Periodic sync triggered");
                await triggerBackgroundSync();
            }
        };

        navigator.serviceWorker.addEventListener("periodicsync", handlePeriodicSync);

        return () => {
            navigator.serviceWorker.removeEventListener("periodicsync", handlePeriodicSync);
        };
    }, [triggerBackgroundSync]);

    return null;
};

// ============================================================================
// PUSH SUBSCRIPTION BUTTON COMPONENT
// ============================================================================

interface PushSubscriptionButtonProps {
    variant?: "button" | "toggle" | "menu";
    showStatus?: boolean;
}

export const PushSubscriptionButton: React.FC<PushSubscriptionButtonProps> = ({
    variant = "button",
    showStatus = true
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

    if (!isSupported) {
        return null; // Don't show on unsupported browsers
    }

    const handleClick = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    if (variant === "toggle") {
        return (
            <button
                onClick={handleClick}
                disabled={isLoading || permission === "denied"}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isSubscribed
                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                }`}
            >
                <span className={`w-2 h-2 rounded-full ${isSubscribed ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-sm font-medium">
                    {isLoading ? "Loading..." : isSubscribed ? "Push Enabled" : "Push Disabled"}
                </span>
            </button>
        );
    }

    if (variant === "menu") {
        return (
            <div className="p-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Push Notifications</p>
                        <p className="text-xs text-muted-foreground">
                            {isSubscribed
                                ? "Receive notifications on your device"
                                : "Enable to get notified about tasks"}
                        </p>
                    </div>
                    <button
                        onClick={handleClick}
                        disabled={isLoading || permission === "denied"}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isSubscribed
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                : "bg-purple-500 text-white hover:bg-purple-600"
                        }`}
                    >
                        {isLoading
                            ? "Loading..."
                            : isSubscribed
                            ? "Disable"
                            : "Enable"}
                    </button>
                </div>
                {error && (
                    <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
            </div>
        );
    }

    // Default button variant
    return (
        <button
            onClick={handleClick}
            disabled={isLoading || permission === "denied"}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                isSubscribed
                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                    : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
        >
            {isLoading
                ? "Loading..."
                : isSubscribed
                ? "✓ Push Enabled"
                : "Enable Push Notifications"}
        </button>
    );
};

export default PushNotificationManager;
