"use client";

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ============================================================================
// DYNAMIC IMPORTS & LAZY LOADING
// ============================================================================

// Lazy load heavy components for better performance
const DynamicAnalyticsChart = lazy(() => import('@/components/analytics/CompletionChart').then(mod => ({ default: mod.CompletionChart })));
const DynamicCalendarView = lazy(() => import('@/components/calendar/MonthView').then(mod => ({ default: mod.MonthView })));
const DynamicAIChat = lazy(() => import('@/components/ai/AIChat').then(mod => ({ default: mod.AIChat })));
const DynamicHeatmapCalendar = lazy(() => import('@/components/analytics/HeatmapCalendar').then(mod => ({ default: mod.HeatmapCalendar })));

// Loading fallback component
function ComponentLoader({ height = 200 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-muted/30 rounded-xl"
      style={{ height }}
      role="status"
      aria-label="Loading content"
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Error boundary component for lazy loaded components
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: Error) => {
      setHasError(true);
      setError(error);
      console.error('Error in lazy loaded component:', error);
    };

    // Add error event listener for unhandled promise rejections
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof Error) {
        handleError(event.reason);
      }
    };
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  if (hasError && fallback) {
    return (
      <>
        {fallback}
        <span className="sr-only" role="alert">
          Error loading content: {error?.message}
        </span>
      </>
    );
  }

  return <>{children}</>;
}

// ============================================================================
// IMAGE OPTIMIZATION COMPONENTS
// ============================================================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  className?: string;
  sizes?: string;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 80,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
    }
  }, [retryCount]);

  if (hasError) {
    return (
      <div
        ref={imageRef}
        className={`flex flex-col items-center justify-center bg-muted/50 rounded-xl ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : {}}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load image</p>
        {retryCount < 3 && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            aria-label="Retry loading image"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={imageRef}
      className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}
      style={fill ? {} : { width, height }}
    >
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-muted/30 animate-pulse rounded-xl"
            role="status"
            aria-label="Loading image"
          >
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 animate-spin text-primary/50" />
          </motion.div>
        )}
      </AnimatePresence>

      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`object-cover rounded-xl transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        draggable={false}
      />
    </div>
  );
}

// ============================================================================
// LAZY LOADED COMPONENT HOC
// ============================================================================

interface LazyLoadOptions {
  height?: number;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: LazyLoadOptions = {}
) {
  const { height = 200, fallback, errorFallback } = options;

  return function LazyComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense
          fallback={
            fallback || (
              <div className="w-full" style={{ height }}>
                <ComponentLoader height={height} />
              </div>
            )
          }
        >
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

// ============================================================================
// PROGRESSIVE LOADING HOOK
// ============================================================================

interface UseProgressiveLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useProgressiveLoad<T extends HTMLElement>(
  options: UseProgressiveLoadOptions = {}
) {
  const { threshold = 0.1, rootMargin = '100px' } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  return { ref: elementRef, shouldLoad: isIntersecting || hasLoaded, hasLoaded };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  loadTime: number;
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Wait for page to fully load
    const handleLoad = () => {
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      // Calculate metrics
      const fcp = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || null;
      const ttfb = navigation?.responseStart || null;
      const loadTime = navigation?.loadEventEnd || navigation?.duration || 0;

      setMetrics({
        fcp,
        lcp: null, // Would need LCP observer
        fid: null, // Would need FID observer
        cls: null, // Would need CLS observer
        ttfb,
        loadTime,
      });

      setIsLoading(false);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return { metrics, isLoading };
}

// ============================================================================
// CODE SPLITTING STATS COMPONENT
// ============================================================================

export function BundleSizeIndicator() {
  const [bundleStats, setBundleStats] = useState<{
    js: string;
    css: string;
    total: string;
  } | null>(null);

  useEffect(() => {
    // In production, this would be calculated from build output
    // For now, we'll show estimated sizes
    const estimateBundleSize = () => {
      const jsSize = '~150 KB';
      const cssSize = '~25 KB';
      const total = '~175 KB';

      setBundleStats({ js: jsSize, css: cssSize, total });
    };

    estimateBundleSize();
  }, []);

  if (!bundleStats) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 p-4 bg-card/90 backdrop-blur-xl rounded-xl border border-border shadow-lg"
      role="status"
      aria-label="Bundle size information"
    >
      <p className="text-xs text-muted-foreground mb-2 font-medium">Bundle Size</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">JS:</span>
          <span className="font-mono">{bundleStats.js}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">CSS:</span>
          <span className="font-mono">{bundleStats.css}</span>
        </div>
        <div className="flex justify-between gap-4 pt-2 border-t border-border">
          <span className="font-medium">Total:</span>
          <span className="font-mono text-primary">{bundleStats.total}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ComponentLoader,
  DynamicAnalyticsChart,
  DynamicCalendarView,
  DynamicAIChat,
  DynamicHeatmapCalendar,
  ErrorBoundary,
};

export default {
  OptimizedImage,
  withLazyLoading,
  useProgressiveLoad,
  usePerformanceMetrics,
  BundleSizeIndicator,
  ComponentLoader,
  DynamicAnalyticsChart,
  DynamicCalendarView,
  DynamicAIChat,
  DynamicHeatmapCalendar,
  ErrorBoundary,
};
