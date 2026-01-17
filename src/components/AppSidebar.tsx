"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  Calendar as CalendarIcon,
  Timer,
  Target,
  Trophy,
  X,
  Sparkles,
  LogOut,
  Award,
  LayoutTemplate,
  Download
} from "lucide-react";
import { Button } from "./ui/Button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { usePWA } from "@/context/PWAContext";

// Helper Component for Install Button
const PWAInstallButton = () => {
  const { isInstallable, installApp } = usePWA();
  if (!isInstallable) return null;

  return (
    <div className="mb-6">
      <Button
        onClick={installApp}
        className="neu-convex w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-[1.02] active:scale-[0.98] text-white border-0 font-bold shadow-lg shadow-purple-500/20"
      >
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>
    </div>
  );
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ITEMS = [
  { name: "Routine", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Templates", href: "/marketplace", icon: LayoutTemplate },
];

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarOpen: isOpen, setSidebarOpen: setIsOpen } = useUI();
  const { user: currentUser, logout } = useAuth();

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-4 left-4 z-[70] w-72 transform rounded-[2.5rem] glass-premium transition-all duration-500 ease-out shadow-2xl shadow-purple-900/30 border-white/20 overflow-hidden flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-[150%]"
        )}
      >
        {/* Header */}
        <div className="flex h-24 items-center justify-between px-8 pt-4 pb-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-[1rem] neu-convex p-1">
              <img src="/logo.jpg" alt="Routine Logo" className="h-full w-full object-cover rounded-[0.8rem]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">RT</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pro</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="neu-flat h-10 w-10 rounded-xl text-muted-foreground hover:text-red-400"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-6 py-4 overflow-y-auto scrollbar-hide">
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-300 relative overflow-hidden",
                  isActive
                    ? "neu-concave text-purple-500" // Pressed state for active
                    : "neu-flat hover:neu-convex text-foreground/70 hover:text-foreground" // Flat to Convex on hover
                )}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                )}

                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive
                    ? "text-purple-500 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    : "text-muted-foreground group-hover:text-purple-400 group-hover:scale-110"
                )} />
                <span className="relative z-10">{item.name}</span>

                {isActive && (
                    <div className="absolute right-4 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-6 mt-auto relative z-20">
          <PWAInstallButton />

          {currentUser ? (
            <div className="neu-convex group relative overflow-hidden rounded-[2rem] p-1 transition-all duration-300 hover:scale-[1.02]">
              <div className="bg-white/5 rounded-[1.8rem] p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-inner">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                        {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <h4 className="truncate text-sm font-bold text-foreground">
                      {currentUser.displayName || "Pro Member"}
                    </h4>
                    <p className="truncate text-xs text-muted-foreground/80 font-medium">
                      {currentUser.email}
                    </p>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl neu-flat text-muted-foreground hover:text-red-400 hover:neu-concave transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-purple-500/5 px-3 py-2 border border-purple-500/10">
                  <Sparkles className="h-3 w-3 text-purple-500 fill-purple-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500">
                    Premium Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="neu-concave rounded-[2rem] p-6 text-center">
              <p className="text-sm font-bold text-muted-foreground">Guest User</p>
              <Link href="/login" className="mt-2 text-xs font-medium text-purple-500 hover:underline">
                Sign in to sync
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {
        isOpen && (
          <div
            className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-md animate-in fade-in duration-500"
            onClick={() => setIsOpen(false)}
          />
        )
      }
    </>
  );
};

export { AppSidebar };
