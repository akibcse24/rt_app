// ============================================================================
// ENHANCED SYNCHRONIZATION UI COMPONENTS
// ============================================================================
// Professional sync status indicators, modals, and toast components
// with proper accessibility and animations.

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSync } from "@/context/SyncContext";
import { useAuth } from "@/context/AuthContext";
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  Zap
} from "lucide-react";
import { GlassCard } from "@/components/ui/EnhancedComponents";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

// ============================================================================
// SYNC STATUS INDICATOR
// ============================================================================

export function SyncStatusIndicator() {
  const { status, isOnline, isSyncing, pendingCount, queue, forceSync, showStatus, setShowStatus } = useSync();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-hide after 3 seconds when synced
  useEffect(() => {
    if (status === "success" && pendingCount === 0) {
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, pendingCount, setShowStatus]);

  // Don't show if online with no pending operations and not expanded
  if (isOnline && pendingCount === 0 && !isExpanded && !showStatus && status !== "error") {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "syncing":
        return {
          icon: RefreshCw,
          text: "Syncing...",
          bgColor: "from-blue-500/20 to-indigo-500/20",
          borderColor: "border-blue-500/30",
          textColor: "text-blue-400",
          pulse: true,
        };
      case "offline":
        return {
          icon: WifiOff,
          text: "Offline Mode",
          bgColor: "from-amber-500/20 to-orange-500/20",
          borderColor: "border-amber-500/30",
          textColor: "text-amber-400",
          pulse: false,
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Sync Error",
          bgColor: "from-red-500/20 to-pink-500/20",
          borderColor: "border-red-500/30",
          textColor: "text-red-400",
          pulse: true,
        };
      case "success":
        return {
          icon: CheckCircle2,
          text: "All Synced",
          bgColor: "from-emerald-500/20 to-green-500/20",
          borderColor: "border-emerald-500/30",
          textColor: "text-emerald-400",
          pulse: false,
        };
      default: // idle
        return {
          icon: Cloud,
          text: "Ready",
          bgColor: "from-slate-500/20 to-gray-500/20",
          borderColor: "border-slate-500/30",
          textColor: "text-slate-400",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <>
      {/* Main Status Indicator */}
      <div
        className={`
          fixed bottom-4 right-4 z-50
          transition-all duration-300 ease-out
          ${isExpanded ? "w-80" : "w-auto"}
        `}
        role="status"
        aria-live="polite"
        aria-label={`Sync status: ${config.text}`}
      >
        <GlassCard
          className={`
            flex items-center gap-3 px-4 py-3
            bg-gradient-to-br ${config.bgColor}
            border ${config.borderColor}
            backdrop-blur-xl
            ${isExpanded ? "rounded-2xl" : "rounded-full"}
            cursor-pointer
            hover:shadow-lg hover:shadow-black/20
            transition-all duration-200
          `}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Icon */}
          <div className={`relative flex-shrink-0 ${config.pulse ? "animate-pulse" : ""}`}>
            <Icon className={`w-5 h-5 ${config.textColor}`} />
            {status === "syncing" && (
              <span className="absolute inset-0 animate-spin">
                <Icon className={`w-5 h-5 ${config.textColor} animate-spin`} />
              </span>
            )}
          </div>

          {/* Status Text */}
          <div className={`flex-1 text-sm font-medium ${config.textColor}`}>
            {config.text}
            {pendingCount > 0 && status !== "syncing" && (
              <span className="ml-2 text-xs opacity-75">
                ({pendingCount} pending)
              </span>
            )}
          </div>

          {/* Expand/Collapse Arrow */}
          {pendingCount > 0 && (
            <ChevronUp 
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
            />
          )}
        </GlassCard>

        {/* Expanded Panel */}
        {isExpanded && pendingCount > 0 && (
          <div className="mt-2 animate-slide-in-up">
            <SyncDetailsPanel onClose={() => setIsExpanded(false)} />
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// SYNC DETAILS PANEL
// ============================================================================

export function SyncDetailsPanel({ onClose }: { onClose: () => void }) {
  const { queue, pendingCount, forceSync, status, retryOperation, clearQueue, removeOperation } = useSync();
  const { user } = useAuth();

  // Group operations by collection
  const groupedOps = queue.reduce((acc, op) => {
    if (!acc[op.collection]) {
      acc[op.collection] = [];
    }
    acc[op.collection].push(op);
    return acc;
  }, {} as Record<string, typeof queue>);

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "CREATE": return "➕";
      case "UPDATE": return "✏️";
      case "DELETE": return "🗑️";
      case "TOGGLE": return "✅";
      default: return "📝";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "syncing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <GlassCard className="p-4 space-y-4 bg-slate-900/90 border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Sync Queue</h3>
          <p className="text-sm text-muted-foreground">
            {pendingCount} pending {pendingCount === 1 ? "change" : "changes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={forceSync}
            disabled={status === "syncing" || pendingCount === 0}
            className="gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${status === "syncing" ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Queue List */}
      {queue.length > 0 ? (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {Object.entries(groupedOps).map(([collection, ops]) => (
            <div key={collection} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                {collection}
              </div>
              {ops.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getOperationIcon(op.type)}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {op.documentId.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(op.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(op.status)}
                    {op.status === "failed" && (
                      <button
                        onClick={() => retryOperation(op.id)}
                        className="p-1 rounded hover:bg-amber-500/20 text-amber-400 transition-colors"
                        aria-label="Retry operation"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                    {op.status === "pending" && (
                      <button
                        onClick={() => removeOperation(op.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        aria-label="Remove operation"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-emerald-500/10 mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-sm text-muted-foreground">All changes synced</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your data is up to date
          </p>
        </div>
      )}

      {/* Footer Actions */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={clearQueue}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear completed
          </button>
          <span className="text-xs text-muted-foreground">
            Auto-sync enabled
          </span>
        </div>
      )}
    </GlassCard>
  );
}

// ============================================================================
// OFFLINE BANNER COMPONENT
// ============================================================================

export function OfflineBanner() {
  const { isOnline, pendingCount } = useSync();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner when offline with pending changes
    if (!isOnline && pendingCount > 0) {
      setIsVisible(true);
    } else if (isOnline) {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm animate-slide-in-down"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
        <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div className="flex flex-col items-center sm:items-start">
          <p className="text-sm font-medium text-foreground">
            {!isOnline 
              ? "You're offline - Changes saved locally" 
              : "Back online - Syncing changes..."}
          </p>
          {pendingCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {pendingCount} {pendingCount === 1 ? "change" : "changes"} pending sync
            </p>
          )}
        </div>
        {isOnline && (
          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SYNC TOAST COMPONENTS
// ============================================================================

export function showSyncSuccessToast(count: number) {
  toast.success(
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      <div>
        <p className="font-medium">All changes synced!</p>
        <p className="text-xs opacity-75">{count} {count === 1 ? "item" : "items"} synchronized</p>
      </div>
    </div>,
    { duration: 3000 }
  );
}

export function showSyncErrorToast(count: number, onRetry?: () => void) {
  toast.error(
    <div className="flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <div>
        <p className="font-medium">{count} {count === 1 ? "change" : "changes"} failed</p>
        <p className="text-xs opacity-75">Tap to retry</p>
      </div>
    </div>,
    {
      duration: 5000,
      action: onRetry ? {
        label: "Retry",
        onClick: onRetry,
      } : undefined,
    }
  );
}

export function showOfflineToast() {
  toast.warning(
    <div className="flex items-center gap-2">
      <CloudOff className="w-5 h-5 text-amber-400" />
      <div>
        <p className="font-medium">You're offline</p>
        <p className="text-xs opacity-75">Changes will sync when reconnected</p>
      </div>
    </div>,
    { duration: 5000 }
  );
}

export function showBackOnlineToast(pendingCount: number) {
  toast.info(
    <div className="flex items-center gap-2">
      <Zap className="w-5 h-5 text-blue-400" />
      <div>
        <p className="font-medium">Connection restored</p>
        <p className="text-xs opacity-75">
          Syncing {pendingCount} {pendingCount === 1 ? "change" : "changes"}...
        </p>
      </div>
    </div>,
    { duration: 3000 }
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export {
  SyncStatusIndicator as default,
};
