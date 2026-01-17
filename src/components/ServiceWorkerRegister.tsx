"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register Firebase Cloud Messaging service worker
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("FCM SW registered: ", registration.scope);
        })
        .catch((registrationError) => {
          console.log("FCM SW registration failed: ", registrationError);
        });

      // Also register the main service worker for other features
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Main SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("Main SW registration failed: ", registrationError);
        });
    }
  }, []);

  return null;
}
