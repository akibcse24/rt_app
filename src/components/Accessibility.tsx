"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";

// ============================================================================
// ACCESSIBILITY UTILITIES & COMPONENTS
// ============================================================================
// Comprehensive accessibility implementation for WCAG 2.1 AA compliance.
// Provides keyboard navigation, screen reader support, focus management,
// and reduced motion preferences.

// ----------------------------------------------------------------------------
// SKIP LINKS & NAVIGATION
// ----------------------------------------------------------------------------

/**
 * Skip link for keyboard navigation - helps users skip navigation and go directly to main content
 * Meets WCAG 2.1 AA Success Criterion 2.4.1 (Bypass Blocks)
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-primary focus:text-primary-foreground focus:font-bold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg left-4 top-4"
    >
      Skip to main content
    </a>
  );
}

/**
 * Skip link for bypassing repeated sidebar navigation
 */
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:z-[9999] focus:p-4 focus:bg-background focus:text-foreground focus:font-semibold focus:border focus:border-input focus:shadow-lg rounded-md left-4 top-4"
    >
      Skip to main content
    </a>
  );
}

// ----------------------------------------------------------------------------
// LIVE REGIONS & SCREEN READER ANNOUNCEMENTS
// ----------------------------------------------------------------------------

interface LiveRegionProps {
  message: string;
  type?: "polite" | "assertive";
  clearAfter?: number;
}

/**
 * Live region for screen readers to announce dynamic content changes
 * WCAG 4.1.3 (Status Messages)
 */
export function LiveRegion({ message, type = "polite", clearAfter = 1000 }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const [displayedMessage, setDisplayedMessage] = useState(message);

  useEffect(() => {
    // Only announce when message changes and is not empty
    if (message && message !== displayedMessage) {
      setDisplayedMessage(message);
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setDisplayedMessage("");
        }, clearAfter);
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter, displayedMessage]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {displayedMessage}
    </div>
  );
}

/**
 * Announce errors to screen readers with assertive priority
 */
export function ErrorAnnouncer({ error }: { error: string | null }) {
  return <LiveRegion message={error || ""} type="assertive" />;
}

/**
 * Announce success messages to screen readers
 */
export function SuccessAnnouncer({ message }: { message: string }) {
  return <LiveRegion message={message} type="polite" clearAfter={500} />;
}

/**
 * Announcer context for complex applications with multiple live regions
 */
interface AnnouncerContextType {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AnnouncerContext = React.createContext<AnnouncerContextType | null>(null);

/**
 * Provider component for centralized announcement management
 */
export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [announcement, setAnnouncement] = useState<{ message: string; priority: "polite" | "assertive" } | null>(null);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    setAnnouncement({ message, priority });
    // Clear after animation completes
    setTimeout(() => setAnnouncement(null), 1000);
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {announcement && (
        <LiveRegion message={announcement.message} type={announcement.priority} clearAfter={0} />
      )}
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook to access the announcer context
 */
export function useAnnouncer() {
  const context = React.useContext(AnnouncerContext);
  if (!context) {
    return { announce: (message: string) => console.warn("AnnouncerProvider not found") };
  }
  return context;
}

// ----------------------------------------------------------------------------
// FOCUS MANAGEMENT
// ----------------------------------------------------------------------------

/**
 * Hook to trap focus within a container (for modals, dialogs, menus)
 * WCAG 2.4.3 (Focus Order)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Handle Tab key for focus trapping
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle Escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Emit custom event for parent component to handle
        container.dispatchEvent(new CustomEvent("focus-trap-escape"));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleEscape);

    // Focus first element
    firstElement?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleEscape);
      // Return focus to the element that triggered the trap
      previousActiveElement.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to manage focus restoration when navigating back to a page
 */
export function useFocusRestore<T extends HTMLElement = HTMLHeadingElement>(selector?: string) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    // Announce page change to screen readers
    const announcePageChange = () => {
      const heading = document.querySelector("h1");
      if (heading) {
        const liveRegion = document.querySelector('[role="status"]') as HTMLElement;
        if (liveRegion) {
          liveRegion.textContent = `Navigated to ${heading.textContent}`;
        }
      }
    };

    announcePageChange();

    // Focus management
    if (selector) {
      const element = document.querySelector<T>(selector);
      element?.focus();
    } else {
      elementRef.current?.focus();
    }
  }, [selector]);

  return elementRef;
}

/**
 * Hook to detect when user is navigating away to manage focus properly
 */
export function useFocusOnMount<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return ref;
}

// ----------------------------------------------------------------------------
// REDUCED MOTION SUPPORT
// ----------------------------------------------------------------------------

/**
 * Hook to detect user's motion preference
 * WCAG 2.3.3 (Animation from Interactions)
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setReduced(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(reducedMotion: boolean): string {
  return reducedMotion ? "0ms" : "200ms";
}

/**
 * CSS variable configuration for reduced motion
 */
export const reducedMotionStyles = {
  transition: "none",
  animation: "none",
} as const;

// ----------------------------------------------------------------------------
// ACCESSIBLE BUTTONS
// ----------------------------------------------------------------------------

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const buttonVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 py-2",
  lg: "h-11 px-8 text-lg",
};

/**
 * Accessible button with comprehensive ARIA support
 * WCAG 4.1.2 (Name, Role, Value)
 */
export function AccessibleButton({
  children,
  loading = false,
  loadingText = "Loading...",
  icon,
  iconPosition = "left",
  disabled,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: AccessibleButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${className}
      `}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}
      <span className={loading ? "invisible" : ""}>
        {icon && iconPosition === "left" && <span aria-hidden="true">{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span aria-hidden="true">{icon}</span>}
      </span>
      {loading && (
        <span className="sr-only">
          {loadingText}
        </span>
      )}
    </button>
  );
}

// ----------------------------------------------------------------------------
// ACCESSIBLE FORM INPUTS
// ----------------------------------------------------------------------------

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showCharCount?: boolean;
}

export function AccessibleInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  required,
  maxLength,
  value,
  className = "",
  showCharCount = false,
  ...props
}: AccessibleInputProps) {
  const generatedId = useCallback(() => 
    `input-${label.toLowerCase().replace(/\s+/g, "-")}`, [label]
  );
  const inputId = id || generatedId();
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const charCountId = `${inputId}-charcount`;

  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>
        {showCharCount && maxLength && (
          <span id={charCountId} className="text-xs text-muted-foreground">
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          {...props}
          id={inputId}
          required={required}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            [error && errorId, helperText && helperId, showCharCount && maxLength && charCountId]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-required={required}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-muted/50 border border-border
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
            transition-all duration-200
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            ${error ? "border-destructive focus:ring-destructive" : ""}
            ${className}
          `}
        />

        {rightIcon && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// ACCESSIBLE TEXTAREA
// ----------------------------------------------------------------------------

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
}

export function AccessibleTextarea({
  label,
  error,
  helperText,
  id,
  required,
  maxLength,
  value,
  className = "",
  showCharCount = false,
  ...props
}: AccessibleTextareaProps) {
  const inputId = id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const charCountId = `${inputId}-charcount`;

  const charCount = typeof value === "string" ? value.length : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </label>
        {showCharCount && maxLength && (
          <span id={charCountId} className="text-xs text-muted-foreground">
            {charCount}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        {...props}
        id={inputId}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          [error && errorId, helperText && helperId, showCharCount && maxLength && charCountId]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-required={required}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-muted/50 border border-border
          text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          transition-all duration-200 resize-y min-h-[100px]
          ${error ? "border-destructive focus:ring-destructive" : ""}
          ${className}
        `}
      />

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// ACCESSIBLE MODAL DIALOG
// ----------------------------------------------------------------------------

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  closeLabel?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Accessible modal dialog with focus trap, escape key handling, and ARIA attributes
 * WCAG 2.4.3 (Focus Order), WCAG 2.4.13 (Focus Appearance)
 */
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  closeLabel = "Close modal",
  size = "md",
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title";

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Focus trap
  const focusTrapRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={(el) => {
          (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (focusTrapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className={`
          relative z-10 w-full ${sizeClasses[size]} mx-4
          bg-card rounded-3xl border border-border shadow-2xl
          animate-scale-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={closeLabel}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        {description && (
          <p id="modal-description" className="px-6 py-2 text-muted-foreground">
            {description}
          </p>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// ACCESSIBLE CARD COMPONENT
// ----------------------------------------------------------------------------

interface AccessibleCardProps {
  as?: "div" | "article" | "section" | "li";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  headline?: string;
  description?: string;
}

/**
 * Accessible card component with proper heading structure and interactive support
 */
export function AccessibleCard({
  as: Component = "div",
  children,
  className = "",
  onClick,
  interactive = false,
  headline,
  description,
}: AccessibleCardProps) {
  const classes = `
    rounded-2xl border border-border bg-card p-6
    transition-all duration-200
    ${interactive ? "cursor-pointer hover:shadow-lg hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring" : ""}
    ${className}
  `;

  if (interactive && onClick) {
    return (
      <Component
        className={classes}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        tabIndex={0}
        role={headline ? "article" : "button"}
        aria-pressed={interactive ? undefined : false}
      >
        {headline && <h3 className="font-semibold text-lg mb-1">{headline}</h3>}
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
        {children}
      </Component>
    );
  }

  return (
    <Component className={classes}>
      {headline && <h3 className="font-semibold text-lg mb-1">{headline}</h3>}
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {children}
    </Component>
  );
}

// ----------------------------------------------------------------------------
// ACCESSIBLE SELECT COMPONENT
// ----------------------------------------------------------------------------

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function AccessibleSelect({
  label,
  error,
  helperText,
  id,
  required,
  options,
  placeholder,
  className = "",
  ...props
}: AccessibleSelectProps) {
  const inputId = id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>

      <select
        {...props}
        id={inputId}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          [error && errorId, helperText && helperId]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`
          w-full px-4 py-3 rounded-xl
          bg-muted/50 border border-border
          text-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? "border-destructive focus:ring-destructive" : ""}
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// CHECKBOX & RADIO GROUP COMPONENTS
// ----------------------------------------------------------------------------

interface AccessibleCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  inputType?: "checkbox" | "radio";
}

export function AccessibleCheckbox({
  label,
  description,
  inputType = "checkbox",
  id,
  className = "",
  ...props
}: AccessibleCheckboxProps) {
  const checkboxId = id || `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const descriptionId = `${checkboxId}-description`;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        type={inputType}
        id={checkboxId}
        aria-describedby={description ? descriptionId : undefined}
        className="mt-1 h-5 w-5 rounded border-border bg-muted text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface AccessibleRadioGroupProps {
  name: string;
  label: string;
  options: { value: string; label: string; description?: string }[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function AccessibleRadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  required,
}: AccessibleRadioGroupProps) {
  const groupId = `radio-group-${name}`;
  const errorId = `${groupId}-error`;

  return (
    <fieldset className="space-y-3" role="radiogroup" aria-labelledby={`${groupId}-legend`}>
      <legend id={`${groupId}-legend`} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </legend>
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {options.map((option) => (
          <AccessibleCheckbox
            key={option.value}
            label={option.label}
            description={option.description}
            name={name}
            inputType="radio"
            checked={value === option.value}
            onChange={(e) => e.target.checked && onChange?.(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

// ----------------------------------------------------------------------------
// VISIBILITY & COLOR CONTRAST UTILITIES
// ----------------------------------------------------------------------------

/**
 * Check if a color meets WCAG AA contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const getLuminance = (color: string): number => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Generate accessible color variations based on background
 */
export function getAccessibleColor(
  foreground: string,
  background: string
): { foreground: string; ratio: number } {
  const ratio = (() => {
    const getLuminance = (color: string): number => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;
      
      const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  })();

  return { foreground, ratio };
}

// ----------------------------------------------------------------------------
// KEYBOARD SHORTCUT ANNOUNCEMENT
// ----------------------------------------------------------------------------

interface KeyboardShortcutProps {
  keyName: string;
  description: string;
  showKey?: boolean;
}

/**
 * Display keyboard shortcut with proper accessibility
 */
export function KeyboardShortcut({ keyName, description, showKey = true }: KeyboardShortcutProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {showKey && (
        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">
          {keyName}
        </kbd>
      )}
      <span className="text-muted-foreground">{description}</span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// EXPORTS
// ----------------------------------------------------------------------------

export const a11y = {
  SkipLink,
  SkipToMain,
  LiveRegion,
  ErrorAnnouncer,
  SuccessAnnouncer,
  AnnouncerProvider,
  useAnnouncer,
  useFocusTrap,
  useFocusRestore,
  useFocusOnMount,
  useReducedMotion,
  AccessibleButton,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleModal,
  AccessibleCard,
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleRadioGroup,
  KeyboardShortcut,
  meetsContrastRequirement,
  getAccessibleColor,
};
