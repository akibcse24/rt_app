"use client";

import React, { useEffect, useState, useCallback, createContext, useContext, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants, type HTMLMotionProps } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Info, XCircle, Bell, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();
  return useMemo(
    (): { duration: number; ease: "linear" | readonly [0.4, 0, 0.2, 1] } => ({
      duration: shouldReduceMotion ? 0 : 0.2,
      ease: shouldReduceMotion ? 'linear' : ([0.4, 0, 0.2, 1] as const),
    }),
    [shouldReduceMotion]
  );
}

// ============================================================================
// LOADING STATES & SKELETONS
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'wave',
}: SkeletonProps) {
  const config = useAnimationConfig();
  
  const baseClasses = 'bg-muted/50';
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
    none: '',
  };

  const style = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], animationClasses[animation], className)}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
}

// Text skeleton with lines
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height="1em"
          animation="wave"
        />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} animation="wave" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" height="1.25rem" animation="wave" />
          <Skeleton variant="text" width="25%" height="1rem" animation="wave" />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100%" height={80} animation="wave" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} animation="wave" />
        <Skeleton variant="rectangular" width={80} height={32} animation="wave" />
      </div>
    </div>
  );
}

// List skeleton
export function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
          <Skeleton variant="circular" width={40} height={40} animation="wave" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="70%" height="1rem" animation="wave" />
            <Skeleton variant="text" width="40%" height="0.875rem" animation="wave" />
          </div>
          <Skeleton variant="circular" width={20} height={20} animation="wave" />
        </div>
      ))}
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card/50 p-6 text-center', className)}>
      <Skeleton variant="circular" width={56} height={56} className="mx-auto mb-4" animation="wave" />
      <Skeleton variant="text" width={48} height={32} className="mx-auto mb-2" animation="wave" />
      <Skeleton variant="text" width={80} height={16} className="mx-auto" animation="wave" />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" height={24} animation="wave" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" width="100%" height={40} animation="wave" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label = 'Loading' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-4',
  };

  return (
    <div
      className={cn('inline-block animate-spin rounded-full border-primary border-t-transparent', sizeClasses[size], className)}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Full page loader
export function PageLoader({ message = 'Loading...', className }: { message?: string; className?: string }) {
  const config = useAnimationConfig();

  return (
    <div
      className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-6', className)}
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: config.duration, ease: config.ease }}
      >
        <div className="relative">
          <LoadingSpinner size="lg" />
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: config.duration }}
        className="text-muted-foreground text-center"
      >
        {message}
      </motion.p>
    </div>
  );
}

// ============================================================================
// ANIMATED TRANSITIONS
// ============================================================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 0.3, className }: FadeInProps) {
  const config = useAnimationConfig();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: config.ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SlideInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  className?: string;
}

export function SlideIn({ children, direction = 'up', distance = 20, className }: SlideInProps) {
  const config = useAnimationConfig();

  const directionMap = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directionMap[direction] }}
      transition={{ duration: config.duration, delay: config.duration, ease: config.ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// ACCESSIBLE MODAL
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const config = useAnimationConfig();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus trap
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements?.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      document.body.style.overflow = '';
      // Return focus
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }

      if (e.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: config.duration }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: config.duration, ease: config.ease }}
          className={cn(
            'relative z-10 w-full mx-4 glass-panel shadow-2xl shadow-purple-900/20',
            sizeClasses[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 id="modal-title" className="text-xl font-semibold">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
              aria-label="Close modal"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const config = useAnimationConfig();

  const toastIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const toastStyles: Record<ToastType, string> = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full px-4"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: config.duration, ease: config.ease }}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-xl',
                toastStyles[toast.type]
              )}
              role="alert"
            >
              {toastIcons[toast.type]}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => hideToast(toast.id)}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ============================================================================
// ACCESSIBILITY COMPONENTS
// ============================================================================

// Skip link for keyboard navigation
export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }: { targetId?: string; children?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-medium"
    >
      {children}
    </a>
  );
}

// Live region for screen reader announcements
export function LiveRegion({ message, type = 'polite' }: { message: string; type?: 'polite' | 'assertive' }) {
  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Focus indicator
export function FocusRing({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// GLASS CARD COMPONENT
// ============================================================================

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  blur?: boolean;
}

export function GlassCard({ children, className, hover = false, blur = true, ...props }: GlassCardProps) {
  const config = useAnimationConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: config.duration, ease: config.ease }}
      className={cn(
        'glass-panel transition-all duration-500',
        hover && 'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10',
        blur && 'backdrop-blur-2xl',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================
// All functions and components are already exported at their definition sites
// No additional exports needed here
