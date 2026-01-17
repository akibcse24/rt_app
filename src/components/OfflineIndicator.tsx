// ============================================================================
// OFFLINE INDICATOR (FIXED)
// ============================================================================
// Fixed version with proper SSR protection and sync integration

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react";
import { useSync } from "@/context/SyncContext";
import { GlassCard } from "@/components/ui/EnhancedComponents";

// ============================================================================
// SSR-SAFE UTILS
// ============================================================================

function isClient(): boolean {
  return typeof window !== "undefined";
}

export const OfflineIndicator: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { isOnline, isSyncing, pendingCount, status, forceSync } = useSync();
  const [showIndicator, setShowIndicator] = useState(false);

  // Initialize online status (SSR-safe)
  useEffect(() => {
    if (!isClient()) return;

    // Initial state
    const initialOnline = navigator.onLine;
    setIsOnlineState(initialOnline);
    
    // Show indicator if offline or syncing or has pending changes
    if (!initialOnline || pendingCount > 0) {
      setShowIndicator(true);
    }

    const handleOnline = () => {
      setIsOnlineState(true);
      setShowIndicator(true);
      
      // Hide after 3 seconds if everything is synced
      setTimeout(() => {
        if (pendingCount === 0) {
          setShowIndicator(false);
        }
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnlineState(false);
      setShowIndicator(true);
    };

    // Custom event for sync queue updates
    const handleSyncUpdate = () => {
      setPendingCountState(getPendingCount());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("rt-sync-queue-updated", handleSyncUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("rt-sync-queue-updated", handleSyncUpdate);
    };
  }, []);

  // Local state for SSR safety
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [pendingCountState, setPendingCountState] = useState(0);

  // Update local state when props change
  useEffect(() => {
    setIsOnlineState(isOnline);
  }, [isOnline]);

  useEffect(() => {
    setPendingCountState(pendingCount);
  }, [pendingCount]);

  // Hide if online with no pending operations and not currently syncing
  if (isOnlineState && pendingCountState === 0 && !isSyncing && !showIndicator) {
    return null;
  }

  // Determine indicator state
  const getIndicatorConfig = () => {
    if (!isOnlineState) {
      return {
        icon: WifiOff,
        text: "Working Offline",
        bgGradient: "from-blue-500/90 to-purple-500/90",
        borderColor: "border-blue-400/30",
        badgeText: `${pendingCountState} queued`,
      };
    }
    
    if (isSyncing) {
      return {
        icon: Loader2,
        text: "Syncing data...",
        bgGradient: "from-green-500/90 to-emerald-500/90",
        borderColor: "border-green-400/30",
        badgeText: null,
      };
    }
    
    if (pendingCountState > 0) {
      return {
        icon: CloudOff,
        text: `${pendingCountState} pending`,
        bgGradient: "from-orange-500/90 to-amber-500/90",
        borderColor: "border-orange-400/30",
        badgeText: null,
      };
    }
    
    return {
      icon: Cloud,
      text: "All synced",
      bgGradient: "from-green-500/90 to-emerald-500/90",
      borderColor: "border-green-400/30",
      badgeText: null,
    };
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${config.text}`}
    >
      <GlassCard
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-full
          bg-gradient-to-r ${config.bgGradient}
          border ${config.borderColor}
          text-white
          shadow-lg backdrop-blur-md
        `}
      >
        {/* Icon */}
        <div className={`relative flex-shrink-0 ${isSyncing ? "animate-spin" : ""}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Status Text */}
        <span className="text-sm font-semibold">
          {config.text}
        </span>

        {/* Badge for pending count */}
        {config.badgeText && (
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
            {config.badgeText}
          </span>
        )}
      </GlassCard>
    </div>
  );
};

// ============================================================================
// LEGACY EXPports (for backward compatibility)
// ============================================================================

// Helper function to get pending count (for components that don't use the context)
function getPendingCount(): number {
  if (!isClient()) return 0;
  
  try {
    const stored = localStorage.getItem("rt_pending_operations");
    if (stored) {
      const operations = JSON.parse(stored);
      return operations.filter((op: { status: string }) => op.status === "pending").length;
    }
  } catch {
    // Ignore errors
  }
  
  return 0;
}

export default OfflineIndicator;
