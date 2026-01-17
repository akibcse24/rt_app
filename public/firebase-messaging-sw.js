// ============================================================================
// FIREBASE CLOUD MESSAGING SERVICE WORKER
// ============================================================================
// This service worker handles:
// 1. Push notifications (foreground and background)
// 2. Silent push notifications for background data sync
// 3. Notification click handling
// 4. Notification display with custom actions

importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// Firebase configuration (must match the web app config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Messaging instance
const messaging = firebase.messaging();

// ============================================================================
// PUSH NOTIFICATION HANDLER
// ============================================================================

messaging.onPush((payload) => {
  console.log("[FCM] Push received:", payload);

  const data = payload.data || {};
  
  // Check if it's a silent push (for background sync)
  if (data.type === "silent") {
    handleSilentPush(payload);
    return;
  }

  // Regular push notification
  const title = data.title || "Routine Tracker";
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.jpg",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "default",
    data: {
      url: data.url || "/",
      type: data.type || "info",
      ...data
    },
    actions: parseActions(data.actions),
    requireInteraction: data.priority === "urgent",
    vibrate: [200, 100, 200],
    renotify: true
  };

  // Show notification
  self.registration.showNotification(title, options);
});

// ============================================================================
// SILENT PUSH HANDLER (Background Sync)
// ============================================================================

async function handleSilentPush(payload) {
  console.log("[FCM] Handling silent push for background sync");
  
  const data = payload.data || {};
  
  try {
    switch (data.syncType) {
      case "task-sync":
        await syncTasks(data);
        break;
      case "stats-sync":
        await syncStats(data);
        break;
      case "achievement-sync":
        await syncAchievements(data);
        break;
      default:
        console.log("[FCM] Unknown silent push type:", data.syncType);
    }
    
    // Close the notification silently (no UI shown for silent pushes)
    await self.registration.showNotification("Syncing...", {
      body: "Updating your data...",
      tag: "sync",
      silent: true
    });
    
    // Close the sync notification after a moment
    setTimeout(() => {
      self.registration.getNotifications({ tag: "sync" }).then(notifications => {
        notifications.forEach(n => n.close());
      });
    }, 2000);
    
  } catch (error) {
    console.error("[FCM] Silent push sync failed:", error);
  }
}

async function syncTasks(data) {
  // Handle task synchronization
  console.log("[FCM] Syncing tasks:", data);
  // Implementation would sync task data with Firestore
}

async function syncStats(data) {
  // Handle stats synchronization
  console.log("[FCM] Syncing stats:", data);
  // Implementation would sync analytics data
}

async function syncAchievements(data) {
  // Handle achievement synchronization
  console.log("[FCM] Syncing achievements:", data);
  // Implementation would sync achievement progress
}

// ============================================================================
// NOTIFICATION CLICK HANDLER
// ============================================================================

messaging.onNotificationClick((event) => {
  console.log("[FCM] Notification clicked:", event);
  
  const data = event.notification.data || {};
  let url = data.url || "/";
  
  // Handle different action clicks
  if (event.action) {
    url = handleActionClick(event.action, data);
  }
  
  // Close the notification
  event.notification.close();
  
  // Open the URL
  if (clients.openWindow) {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

function handleActionClick(action, data) {
  const actionHandlers = {
    "complete": () => {
      // Handle task completion
      sendMessageToClient({ type: "task-complete", taskId: data.taskId });
      return data.url || "/";
    },
    "snooze": () => {
      // Handle snooze action
      sendMessageToClient({ type: "task-snooze", taskId: data.taskId, duration: 5 });
      return data.url || "/";
    },
    "view": () => {
      return data.url || "/";
    },
    "dismiss": () => {
      return "/";
    }
  };
  
  const handler = actionHandlers[action] || actionHandlers["view"];
  return handler();
}

// ============================================================================
// BACKGROUND MESSAGE HANDLER (When app is in background)
// ============================================================================

messaging.onBackgroundMessage((payload) => {
  console.log("[FCM] Background message received:", payload);
  
  const data = payload.data || {};
  
  // For background messages, we show a notification
  if (data.showNotification !== "false") {
    const title = data.title || "Routine Tracker";
    const options = {
      body: data.body || "",
      icon: data.icon || "/logo.jpg",
      badge: data.badge || "/icon-192.png",
      tag: data.tag || "background",
      data: {
        url: data.url || "/",
        ...data
      },
      requireInteraction: data.priority === "urgent",
      silent: data.silent === "true"
    };
    
    return self.registration.showNotification(title, options);
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseActions(actionsData) {
  if (!actionsData) return [];
  
  try {
    return JSON.parse(actionsData);
  } catch {
    return [];
  }
}

function sendMessageToClient(message) {
  // Send message to all open clients
  clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// ============================================================================
// SERVICE WORKER LIFECYCLE
// ============================================================================

self.addEventListener("install", (event) => {
  console.log("[FCM] Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[FCM] Service Worker activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("push event", (event) => {
  console.log("[FCM] Push event received");
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[FCM] Notification closed:", event.notification.tag);
});
