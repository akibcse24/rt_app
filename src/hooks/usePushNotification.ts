// ============================================================================
// USE PUSH NOTIFICATION HOOK
// ============================================================================
// This hook manages:
// 1. Push notification permission requests
// 2. FCM token management and subscription
// 3. Push subscription sync with Firestore
// 4. Notification foreground handling

import { useState, useEffect, useCallback, useRef } from "react";
import { getMessagingClient, vapidKey } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Validate VAPID key
if (!vapidKey) {
    console.warn("[Push] VAPID key is missing. Push notifications will not work.");
}

interface PushNotificationState {
    isSupported: boolean;
    permission: NotificationPermission | "unsupported";
    isSubscribed: boolean;
    fcmToken: string | null;
    isLoading: boolean;
    error: string | null;
}

interface PushNotificationActions {
    requestPermission: () => Promise<boolean>;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<void>;
    checkSubscriptionStatus: () => Promise<void>;
}

export const usePushNotification = (): PushNotificationState & PushNotificationActions => {
    const { user } = useAuth();
    const [state, setState] = useState<PushNotificationState>({
        isSupported: false,
        permission: "default",
        isSubscribed: false,
        fcmToken: null,
        isLoading: true,
        error: null
    });

    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Check browser support and current permission status
    const checkSupport = useCallback(async () => {
        const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
        let permission: NotificationPermission = "denied";

        if (isSupported && "Notification" in window) {
            permission = Notification.permission;
        }

        setState(prev => ({ ...prev, isSupported, permission, isLoading: false }));

        return { isSupported, permission };
    }, []);

    // Save subscription to Firestore
    const saveSubscriptionToFirestore = useCallback(async (subscription: PushSubscription, token: string) => {
        if (!user) return;

        try {
            const subscriptionDoc = doc(db, "users", user.uid, "pushSubscriptions", "current");

            // Convert subscription to JSON
            const subscriptionData = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.toJSON().keys?.p256dh,
                    auth: subscription.toJSON().keys?.auth
                },
                fcmToken: token,
                createdAt: serverTimestamp(),
                userAgent: navigator.userAgent,
                active: true
            };

            await setDoc(subscriptionDoc, subscriptionData, { merge: true });
            console.log("[Push] Subscription saved to Firestore");
        } catch (error) {
            console.error("[Push] Failed to save subscription:", error);
        }
    }, [user]);

    // Remove subscription from Firestore
    const removeSubscriptionFromFirestore = useCallback(async () => {
        if (!user) return;

        try {
            const subscriptionDoc = doc(db, "users", user.uid, "pushSubscriptions", "current");
            await deleteDoc(subscriptionDoc);
            console.log("[Push] Subscription removed from Firestore");
        } catch (error) {
            console.error("[Push] Failed to remove subscription:", error);
        }
    }, [user]);

    // Check if already subscribed
    const checkSubscriptionStatus = useCallback(async () => {
        if (!user) {
            setState(prev => ({ ...prev, isSubscribed: false, fcmToken: null }));
            return;
        }

        try {
            const subscriptionDoc = doc(db, "users", user.uid, "pushSubscriptions", "current");
            const docSnap = await getDoc(subscriptionDoc);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setState(prev => ({
                    ...prev,
                    isSubscribed: data.active === true,
                    fcmToken: data.fcmToken || null
                }));
            } else {
                setState(prev => ({ ...prev, isSubscribed: false, fcmToken: null }));
            }
        } catch (error) {
            console.error("[Push] Failed to check subscription:", error);
            setState(prev => ({ ...prev, isSubscribed: false }));
        }
    }, [user]);

    // Request notification permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!("Notification" in window)) {
            setState(prev => ({ ...prev, error: "Notifications not supported" }));
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setState(prev => ({ ...prev, permission }));
            return permission === "granted";
        } catch (error) {
            console.error("[Push] Permission request failed:", error);
            setState(prev => ({ ...prev, error: "Failed to request permission" }));
            return false;
        }
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!user) {
            setState(prev => ({ ...prev, error: "User not authenticated" }));
            return false;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Check support first
            const { isSupported, permission } = await checkSupport();
            if (!isSupported) {
                throw new Error("Push notifications not supported");
            }

            if (permission !== "granted") {
                const granted = await requestPermission();
                if (!granted) {
                    throw new Error("Notification permission denied");
                }
            }

            // Get messaging instance
            const messaging = await getMessagingClient();
            if (!messaging) {
                throw new Error("Failed to initialize messaging");
            }

            // Register service worker first
            const registration = await navigator.serviceWorker.ready;

            if (!vapidKey) {
                throw new Error("Missing VAPID key. Please configure push notifications.");
            }

            // Get FCM token
            const fcmToken = await getToken(messaging, {
                vapidKey: vapidKey,
                serviceWorkerRegistration: registration
            });

            if (!fcmToken) {
                throw new Error("Failed to get FCM token");
            }

            // Get push subscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey ? urlBase64ToUint8Array(vapidKey) as any : null
            });

            // Save to Firestore
            await saveSubscriptionToFirestore(subscription, fcmToken);

            // Set up foreground message handler
            unsubscribeRef.current = onMessage(messaging, (payload) => {
                console.log("[Push] Foreground message received:", payload);

                // Show in-app notification
                if (payload.notification) {
                    const { title, body, icon } = payload.notification;
                    showInAppNotification(title || "Notification", body || "", icon);
                }
            });

            setState(prev => ({
                ...prev,
                isSubscribed: true,
                fcmToken,
                isLoading: false,
                permission: "granted"
            }));

            console.log("[Push] Successfully subscribed to push notifications");
            return true;

        } catch (error: any) {
            console.error("[Push] Subscription failed:", error);
            setState(prev => ({
                ...prev,
                error: error.message || "Failed to subscribe",
                isLoading: false
            }));
            return false;
        }
    }, [user, checkSupport, requestPermission, saveSubscriptionToFirestore]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        if (!user) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const messaging = await getMessagingClient();
            const registration = await navigator.serviceWorker.ready;

            // Get and unsubscribe from push
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            // Delete FCM token
            if (messaging) {
                // Note: deleteToken is not available in all Firebase versions
                try {
                    // @ts-ignore - deleteToken may not be in the type definition
                    await messaging.deleteToken();
                } catch {
                    console.log("[Push] Token deletion not available");
                }
            }

            // Remove from Firestore
            await removeSubscriptionFromFirestore();

            // Clean up foreground handler
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }

            setState(prev => ({
                ...prev,
                isSubscribed: false,
                fcmToken: null,
                isLoading: false
            }));

            console.log("[Push] Successfully unsubscribed from push notifications");
        } catch (error: any) {
            console.error("[Push] Unsubscription failed:", error);
            setState(prev => ({
                ...prev,
                error: error.message || "Failed to unsubscribe",
                isLoading: false
            }));
        }
    }, [user, removeSubscriptionFromFirestore]);

    // Initialize on mount
    useEffect(() => {
        checkSupport();
    }, [checkSupport]);

    // Check subscription status when user changes
    useEffect(() => {
        checkSubscriptionStatus();
    }, [user, checkSubscriptionStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    return {
        ...state,
        requestPermission,
        subscribe,
        unsubscribe,
        checkSubscriptionStatus
    };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showInAppNotification(title: string, body: string, icon?: string) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notification = new Notification(title, {
        body,
        icon: icon || "/logo.jpg",
        badge: "/icon-192.png",
        tag: "in-app",
        requireInteraction: false
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) return new Uint8Array(0);

    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export default usePushNotification;
