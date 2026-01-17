"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORM COMPONENTS WITH ACCESSIBILITY
// ============================================================================

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  required?: boolean;
  id?: string;
}

export function AccessibleInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  required = false,
  id: providedId,
  type = 'text',
  className,
  ...props
}: AccessibleInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = providedId || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

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
      </label>

      <div className="relative">
        {leftIcon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          {...props}
          id={inputId}
          type={inputType}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'bg-muted/50 border border-border',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
        />

        {rightIcon && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// SELECT COMPONENT
// ============================================================================

interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}

export function AccessibleSelect({
  label,
  options,
  error,
  hint,
  required = false,
  placeholder = 'Select an option',
  id: providedId,
  className,
  ...props
}: AccessibleSelectProps) {
  const selectId = providedId || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <select
        {...props}
        id={selectId}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined
        }
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-muted/50 border border-border',
          'text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200 appearance-none cursor-pointer',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
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
        <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

export function AccessibleTextarea({
  label,
  error,
  hint,
  required = false,
  showCharCount = false,
  maxLength = 1000,
  id: providedId,
  className,
  value,
  ...props
}: AccessibleTextareaProps) {
  const textareaId = providedId || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className="space-y-2">
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <textarea
        {...props}
        id={textareaId}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          [error && errorId, hint && hintId, showCharCount && `${textareaId}-count`]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={cn(
          'w-full px-4 py-3 rounded-xl',
          'bg-muted/50 border border-border',
          'text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200 resize-none',
          error && 'border-destructive focus:ring-destructive',
          className
        )}
      />

      <div className="flex justify-between">
        {error ? (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : (
          <span />
        )}

        {showCharCount && (
          <span
            id={`${textareaId}-count`}
            className={cn(
              'text-sm',
              charCount >= maxLength ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================

interface AccessibleCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export function AccessibleCheckbox({
  label,
  description,
  error,
  id: providedId,
  className,
  ...props
}: AccessibleCheckboxProps) {
  const checkboxId = providedId || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${checkboxId}-error`;

  return (
    <div className="flex items-start gap-3">
      <input
        {...props}
        id={checkboxId}
        type="checkbox"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'mt-1 w-5 h-5 rounded border-border',
          'bg-muted/50 text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200',
          error && 'border-destructive',
          className
        )}
      />

      <div className="flex-1">
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          {label}
        </label>

        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}

        {error && (
          <p id={errorId} className="text-sm text-destructive flex items-center gap-1 mt-1" role="alert">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
    outline: 'border border-border bg-transparent hover:bg-muted',
    ghost: 'bg-transparent hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-2xl',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
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
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// ============================================================================
// ALERT COMPONENTS
// ============================================================================

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ type, title, children, dismissible = false, onDismiss }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-500',
    error: 'bg-red-500/10 border-red-500/20 text-red-500',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl',
        styles[type]
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span aria-hidden="true">{icons[type]}</span>

      <div className="flex-1">
        {title && <p className="font-medium mb-1">{title}</p>}
        <p className="text-sm">{children}</p>
      </div>

      {dismissible && (
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="p-1 hover:bg-muted/50 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================
// All functions and components are already exported at their definition sites
// No additional exports needed here
