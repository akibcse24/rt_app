"use client";

import * as React from "react";
import { useEffect, useCallback } from "react";

// Types for analytics events
interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageView {
  url: string;
  title: string;
}

// Analytics service singleton
class AnalyticsService {
  private initialized = false;

  // Initialize analytics (Google Analytics 4 example)
  init() {
    if (this.initialized || typeof window === "undefined") return;

    // Google Analytics 4 initialization
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID, {
      page_path: window.location.pathname,
    });

    this.initialized = true;
  }

  // Track page views
  trackPageView({ url, title }: PageView) {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }

  // Track custom events
  trackEvent({ action, category, label, value }: AnalyticsEvent) {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Global gtag type declaration
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// React hook for page views
export function usePageView() {
  const trackPageView = useCallback(({ url, title }: PageView) => {
    analytics.trackPageView({ url, title });
  }, []);

  return trackPageView;
}

// React hook for custom events
export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analytics.trackEvent(event);
  }, []);

  const trackSignUp = useCallback((method: string) => {
    analytics.trackEvent({
      action: "sign_up",
      category: "engagement",
      label: method,
    });
  }, []);

  const trackLogin = useCallback((method: string) => {
    analytics.trackEvent({
      action: "login",
      category: "engagement",
      label: method,
    });
  }, []);

  const trackTaskCreated = useCallback((taskType: string) => {
    analytics.trackEvent({
      action: "task_created",
      category: "tasks",
      label: taskType,
    });
  }, []);

  const trackTaskCompleted = useCallback((taskType: string) => {
    analytics.trackEvent({
      action: "task_completed",
      category: "tasks",
      label: taskType,
    });
  }, []);

  const trackFocusSession = useCallback((duration: number) => {
    analytics.trackEvent({
      action: "focus_session_completed",
      category: "focus",
      label: `${duration} minutes`,
      value: duration,
    });
  }, []);

  const trackAchievement = useCallback((achievementId: string) => {
    analytics.trackEvent({
      action: "achievement_unlocked",
      category: "gamification",
      label: achievementId,
    });
  }, []);

  return {
    trackEvent,
    trackSignUp,
    trackLogin,
    trackTaskCreated,
    trackTaskCompleted,
    trackFocusSession,
    trackAchievement,
  };
}

// Initialize analytics on mount
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    analytics.init();
  }, []);

  return <div>{children}</div>;
}

// Predefined event tracking functions for common actions
export const trackEvents = {
  buttonClick: (buttonName: string) =>
    analytics.trackEvent({
      action: "click",
      category: "ui",
      label: buttonName,
    }),
  formSubmit: (formName: string) =>
    analytics.trackEvent({
      action: "submit",
      category: "forms",
      label: formName,
    }),
  externalLink: (url: string) =>
    analytics.trackEvent({
      action: "click",
      category: "external_link",
      label: url,
    }),
  download: (fileName: string) =>
    analytics.trackEvent({
      action: "download",
      category: "files",
      label: fileName,
    }),
  share: (platform: string, contentType: string) =>
    analytics.trackEvent({
      action: "share",
      category: "social",
      label: `${platform}_${contentType}`,
    }),
  search: (searchTerm: string) =>
    analytics.trackEvent({
      action: "search",
      category: "discovery",
      label: searchTerm,
    }),
  scrollDepth: (depth: number) =>
    analytics.trackEvent({
      action: "scroll",
      category: "engagement",
      label: `${depth}%`,
      value: depth,
    }),
};
