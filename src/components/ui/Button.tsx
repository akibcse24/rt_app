import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient" | "neu";
  size?: "sm" | "md" | "lg" | "icon" | "xl";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      // Primary: Glowing Glass Pill
      primary: "bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/60 hover:-translate-y-1 hover:scale-[1.02] border border-white/20 backdrop-blur-md",

      // Secondary: Premium Glass
      secondary: "glass-premium text-foreground hover:bg-white/10 dark:hover:bg-white/5 active:scale-95 hover:-translate-y-0.5",

      // Outline: Concave/Pressed Look (Sunken)
      outline: "neu-concave text-foreground border border-transparent hover:text-primary active:scale-95",

      // Ghost: Simple transparent
      ghost: "bg-transparent hover:bg-muted/30 text-foreground font-medium hover:text-primary backdrop-blur-sm",

      // Danger: Red glass
      danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-red-500/10 hover:shadow-red-500/20",

      // Gradient: Explicit Gradient
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/30 hover:-translate-y-1",

      // Neu: Soft Convex (Popped Out)
      neu: "neu-convex text-foreground hover:text-primary active:neu-concave hover:-translate-y-1",
    };

    const sizes = {
      sm: "h-9 rounded-xl px-4 text-xs font-bold uppercase tracking-wider",
      md: "h-12 rounded-2xl px-6 py-2 text-sm font-bold tracking-tight",
      lg: "h-14 rounded-[1.25rem] px-8 text-base font-bold tracking-tight",
      xl: "h-16 rounded-[1.5rem] px-10 text-lg font-bold tracking-tight",
      icon: "h-12 w-12 p-0 flex items-center justify-center rounded-2xl",
    };

    // If size is icon and variant is neu, apply specific icon styles (which are already in globals.css under .neu-icon-btn)
    const combinedClassName = cn(
      "inline-flex items-center justify-center transition-all duration-500 disabled:pointer-events-none disabled:opacity-50 select-none",
      variants[variant],
      sizes[size],
      size === 'icon' && variant === 'neu' ? 'neu-icon-btn' : '',
      className
    );

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, cn };
