"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";

// Performance metrics interface
interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  loadTime: number;
  renderTime: number;
}

// Type for Layout Shift entries
interface PerformanceLayoutShift {
  hadRecentInput: boolean;
  value: number;
  sources?: Array<{ node?: HTMLElement }>;
}

interface UsageMetrics {
  sessions: number;
  totalTasksCreated: number;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  averageSessionDuration: number;
}

// Performance monitoring service
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    loadTime: 0,
    renderTime: 0,
  };

  private observers: PerformanceObserver[] = [];

  init() {
    if (typeof window === "undefined") return;

    // Measure Time to First Byte
    const navigationEntries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      this.metrics.ttfb = nav.responseStart - nav.requestStart;
      this.metrics.loadTime = nav.loadEventEnd - nav.startTime;
      this.metrics.renderTime =
        nav.domContentLoadedEventEnd - nav.startTime;
    }

    // Observe First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          this.metrics.fcp = entries[0].startTime;
        }
      });
      fcpObserver.observe({ type: "paint", buffered: true });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn("FCP observation not supported");
    }

    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn("LCP observation not supported");
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0] as PerformanceEventTiming;
          this.metrics.fid = firstInput.processingStart - firstInput.startTime;
        }
      });
      fidObserver.observe({ type: "first-input", buffered: true });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn("FID observation not supported");
    }

    // Observe Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as (
          | PerformanceEntry
          | PerformanceLayoutShift
        )[]) {
          if ("hadRecentInput" in entry) {
            const shift = entry as PerformanceLayoutShift;
            if (!shift.hadRecentInput) {
              clsValue += shift.value;
            }
          }
        }
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn("CLS observation not supported");
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getScore(): { score: number; rating: string } {
    const { fcp, lcp, fid, cls } = this.metrics;

    let score = 100;

    // FCP scoring (target: < 1.8s)
    if (fcp && fcp > 2800) score -= 25;
    else if (fcp && fcp > 1800) score -= 10;

    // LCP scoring (target: < 2.5s)
    if (lcp && lcp > 4000) score -= 25;
    else if (lcp && lcp > 2500) score -= 10;

    // FID scoring (target: < 100ms)
    if (fid && fid > 300) score -= 25;
    else if (fid && fid > 100) score -= 10;

    // CLS scoring (target: < 0.1)
    if (cls && cls > 0.25) score -= 25;
    else if (cls && cls > 0.1) score -= 10;

    let rating = "poor";
    if (score >= 90) rating = "excellent";
    else if (score >= 70) rating = "good";
    else if (score >= 50) rating = "needs-improvement";

    return { score: Math.max(0, score), rating };
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Usage tracking hook
export function useUsageTracking() {
  const [metrics, setMetrics] = useState<UsageMetrics>({
    sessions: 0,
    totalTasksCreated: 0,
    totalTasksCompleted: 0,
    totalFocusMinutes: 0,
    averageSessionDuration: 0,
  });

  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    // Load saved metrics from localStorage
    const saved = localStorage.getItem("rt_usage_metrics");
    if (saved) {
      try {
        setMetrics(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to parse usage metrics");
      }
    }

    // Increment session count
    setMetrics((prev) => {
      const updated = { ...prev, sessions: prev.sessions + 1 };
      localStorage.setItem("rt_usage_metrics", JSON.stringify(updated));
      return updated;
    });

    // Track session duration on unload
    const handleUnload = () => {
      const duration = (Date.now() - sessionStartRef.current) / 1000 / 60; // minutes
      const savedData = localStorage.getItem("rt_usage_metrics");
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          const newAvg =
            (data.averageSessionDuration * data.sessions + duration) /
            (data.sessions + 1);
          data.averageSessionDuration = newAvg;
          localStorage.setItem("rt_usage_metrics", JSON.stringify(data));
        } catch (e) {
          console.warn("Failed to update session duration");
        }
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const trackTaskCreated = useCallback(() => {
    setMetrics((prev) => {
      const updated = { ...prev, totalTasksCreated: prev.totalTasksCreated + 1 };
      localStorage.setItem("rt_usage_metrics", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const trackTaskCompleted = useCallback(() => {
    setMetrics((prev) => {
      const updated = { ...prev, totalTasksCompleted: prev.totalTasksCompleted + 1 };
      localStorage.setItem("rt_usage_metrics", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const trackFocusMinutes = useCallback((minutes: number) => {
    setMetrics((prev) => {
      const updated = { ...prev, totalFocusMinutes: prev.totalFocusMinutes + minutes };
      localStorage.setItem("rt_usage_metrics", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    metrics,
    trackTaskCreated,
    trackTaskCompleted,
    trackFocusMinutes,
  };
}

// Performance monitor component
export function PerformanceMonitorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [score, setScore] = useState<{ score: number; rating: string } | null>(
    null
  );

  useEffect(() => {
    if (!isMonitoring) {
      const monitor = new PerformanceMonitor();
      monitor.init();

      // Wait for metrics to stabilize
      const timer = setTimeout(() => {
        const finalMetrics = monitor.getMetrics();
        const finalScore = monitor.getScore();
        setMetrics(finalMetrics);
        setScore(finalScore);
        monitor.cleanup();
      }, 5000);

      setIsMonitoring(true);

      return () => {
        clearTimeout(timer);
        monitor.cleanup();
      };
    }
  }, [isMonitoring]);

  return <div>{children}</div>;
}

// Hook to get performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [score, setScore] = useState<{ score: number; rating: string } | null>(
    null
  );

  useEffect(() => {
    const monitor = new PerformanceMonitor();
    monitor.init();

    const timer = setTimeout(() => {
      const finalMetrics = monitor.getMetrics();
      const finalScore = monitor.getScore();
      setMetrics(finalMetrics);
      setScore(finalScore);
      monitor.cleanup();
    }, 5000);

    return () => {
      clearTimeout(timer);
      monitor.cleanup();
    };
  }, []);

  return { metrics, score };
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
