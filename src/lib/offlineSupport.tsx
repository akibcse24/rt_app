// ============================================================================
// OFFLINE SUPPORT & SYNC UTILITIES (LEGACY COMPATIBILITY)
// ============================================================================
// This file maintains backward compatibility with existing code while
// delegating core functionality to the new SyncContext.

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// TYPES (for backward compatibility)
// ============================================================================

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

// ============================================================================
// SSR-SAFE UTILS
// ============================================================================

function isClient(): boolean {
  return typeof window !== "undefined";
}

function generateId(): string {
  return uuidv4();
}

// ============================================================================
// LEGACY HOOK (Deprecated - use useSync from SyncContext instead)
// ============================================================================

export function useOfflineQueue(options: UseOfflineOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onSyncComplete, onSyncError } = options;

  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  // Load queue from localStorage on mount (SSR-safe)
  useEffect(() => {
    if (!isClient()) return;

    const savedQueue = localStorage.getItem('rt_offline_queue');
    if (savedQueue) {
      try {
        const parsed = JSON.parse(savedQueue);
        setQueue(parsed);
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
      }
    }

    // Check online status
    setIsOnline(navigator.onLine);
  }, []);

  // Save queue to localStorage whenever it changes (SSR-safe)
  useEffect(() => {
    if (!isClient()) return;
    localStorage.setItem('rt_offline_queue', JSON.stringify(queue));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    if (!isClient()) return;

    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queue when coming back online
  const syncQueue = useCallback(async () => {
    if (!isClient()) return;
    if (!isOnline || syncInProgress.current || queue.length === 0) {
      return;
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const operationsToSync = [...queue];

      for (const operation of operationsToSync) {
        try {
          await processOperation(operation);
          // Remove successfully synced operation
          setQueue((prev) => prev.filter((op) => op.id !== operation.id));
        } catch (error) {
          // Handle retry logic
          if (operation.retryCount < maxRetries) {
            setQueue((prev) =>
              prev.map((op) =>
                op.id === operation.id
                  ? { ...op, retryCount: op.retryCount + 1 }
                  : op
              )
            );
          } else {
            // Max retries reached, remove operation and log error
            console.error(`Max retries reached for operation ${operation.id}:`, error);
            setQueue((prev) => prev.filter((op) => op.id !== operation.id));
            onSyncError?.(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }

      onSyncComplete?.();
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, queue, maxRetries, onSyncComplete, onSyncError]);

  // Add operation to queue
  const addToQueue = useCallback(
    (type: QueuedOperation['type'], collection: string, data: Record<string, unknown>) => {
      if (!isClient()) return '';

      const operation: QueuedOperation = {
        id: generateId(),
        type,
        collection,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      setQueue((prev) => [...prev, operation]);

      // If online, try to sync immediately
      if (isOnline && navigator.onLine) {
        syncQueue();
      }

      return operation.id;
    },
    [isOnline, syncQueue]
  );

  // Process a single operation
  const processOperation = async (operation: QueuedOperation): Promise<void> => {
    const { type, collection, data } = operation;

    // Simulate API call - replace with actual API calls
    const endpoint = `/api/${collection}`;

    const response = await fetch(endpoint, {
      method: type === 'delete' ? 'DELETE' : type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  };

  // Clear queue
  const clearQueue = useCallback(() => {
    if (!isClient()) return;
    setQueue([]);
  }, []);

  return {
    queue,
    isOnline,
    isSyncing,
    addToQueue,
    syncQueue,
    clearQueue,
    queueLength: queue.length,
  };
}

// ============================================================================
// OFFLINE INDICATOR COMPONENT (Fixed for SSR)
// ============================================================================

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isClient()) return;

    const checkOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        setShowIndicator(true);
      } else {
        // Show "back online" message briefly
        setShowIndicator(true);
        setTimeout(() => setShowIndicator(false), 3000);
      }
    };

    checkOnline();

    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl transition-all ${
        isOnline
          ? 'bg-green-500/10 border-green-500/20 text-green-500'
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
        }`}
      />
      <span className="text-sm font-medium">
        {isOnline ? 'Back online - Syncing...' : 'You are offline - Changes will sync when connected'}
      </span>
    </div>
  );
}

// ============================================================================
// SYNC STATUS COMPONENT
// ============================================================================

interface SyncStatusProps {
  queueLength?: number;
  isSyncing?: boolean;
  lastSyncTime?: Date;
  className?: string;
}

export function SyncStatus({
  queueLength = 0,
  isSyncing = false,
  lastSyncTime,
  className = '',
}: SyncStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
      role="status"
      aria-label="Sync status"
    >
      {isSyncing ? (
        <>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Syncing...</span>
        </>
      ) : queueLength > 0 ? (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span>{queueLength} pending sync</span>
        </>
      ) : lastSyncTime ? (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Synced</span>
        </>
      ) : null}
    </div>
  );
}

// ============================================================================
// EXPORTS (for backward compatibility)
// ============================================================================
// All functions and components are already exported at their definition sites
// No additional exports needed here
