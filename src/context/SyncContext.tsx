// ============================================================================
// ENHANCED SYNCHRONIZATION ENGINE
// ============================================================================
// A robust offline-first architecture with proper queue management,
// deduplication, conflict resolution, and comprehensive UI feedback.

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  increment,
  FirestoreError
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SyncStatus = "idle" | "syncing" | "offline" | "error" | "success";
export type OperationType = "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";

export interface SyncOperation {
  id: string;
  type: OperationType;
  collection: "tasks" | "goals" | "templates" | "user";
  documentId: string;
  data?: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: "pending" | "syncing" | "completed" | "failed";
  error?: string;
}

export interface SyncStats {
  totalOperations: number;
  pendingOperations: number;
  completedOperations: number;
  failedOperations: number;
  lastSyncTime: number | null;
  lastError: string | null;
}

export interface SyncContextType {
  // Status
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;

  // Stats
  stats: SyncStats;
  pendingCount: number;

  // Operations
  queue: SyncOperation[];
  addOperation: (type: OperationType, collection: SyncOperation["collection"], documentId: string, data?: Record<string, unknown>) => string;
  removeOperation: (id: string) => void;
  clearQueue: () => void;
  retryOperation: (id: string) => void;
  forceSync: () => void;

  // UI Helpers
  showStatus: boolean;
  setShowStatus: (show: boolean) => void;
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const STORAGE_KEY = "rt_sync_queue";
const MAX_RETRIES = 5;
const SYNC_DEBOUNCE_MS = 1000;
const DEDUP_WINDOW_MS = 2000; // Merge updates within 2 seconds

function generateId(): string {
  return uuidv4();
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function getTimestamp(): number {
  return Date.now();
}

// ============================================================================
// SYNC CONTEXT & PROVIDER
// ============================================================================

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<SyncOperation[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Refs for preventing race conditions
  const syncInProgress = useRef(false);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Update user ID ref
  useEffect(() => {
    userIdRef.current = user?.uid || null;
  }, [user]);

  // Load queue from localStorage on mount
  useEffect(() => {
    if (!isClient()) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out operations older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const validOps = parsed.filter((op: SyncOperation) =>
          op.timestamp > sevenDaysAgo && op.status !== "completed"
        );
        setQueue(validOps);

        if (validOps.length > 0) {
          setStatus("offline");
        }
      }
    } catch (error) {
      console.error("[Sync] Failed to load queue:", error);
    }

    // Set initial online status
    setIsOnline(navigator.onLine);
  }, []);

  // Save queue to localStorage and trigger sync whenever it changes
  useEffect(() => {
    if (!isClient()) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

      // Auto-sync if online and has pending operations
      if (isOnline && status !== "syncing" && queue.some(op => op.status === "pending")) {
        if (syncTimeout.current) {
          clearTimeout(syncTimeout.current);
        }
        syncTimeout.current = setTimeout(() => {
          processQueue();
        }, SYNC_DEBOUNCE_MS);
      }
    } catch (error) {
      console.error("[Sync] Failed to save queue:", error);
    }
  }, [queue, isOnline, status]);

  // Online/Offline event listeners
  useEffect(() => {
    if (!isClient()) return;

    const handleOnline = () => {
      setIsOnline(true);
      setStatus("syncing");

      toast.info("Connection restored", {
        description: "Syncing your changes...",
        duration: 2000,
      });

      // Debounce sync to avoid immediate bursts
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
      syncTimeout.current = setTimeout(() => {
        processQueue();
      }, SYNC_DEBOUNCE_MS);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");

      toast.warning("You're offline", {
        description: "Changes will be saved and synced when you reconnect.",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, []);

  // ============================================================================
  // QUEUE OPERATIONS
  // ============================================================================

  const addOperation = useCallback((
    type: OperationType,
    collection: SyncOperation["collection"],
    documentId: string,
    data?: Record<string, unknown>
  ): string => {
    const id = generateId();
    const now = getTimestamp();

    setQueue(prev => {
      // Deduplication: Check for recent operations on the same document
      const recentOp = prev.find(op =>
        op.collection === collection &&
        op.documentId === documentId &&
        op.type !== "DELETE" && // Never deduplicate deletes
        op.type !== type && // Only merge if types are different
        now - op.timestamp < DEDUP_WINDOW_MS
      );

      if (recentOp) {
        // Merge update operations
        if (type === "UPDATE" && recentOp.type === "UPDATE" && data) {
          return prev.map(op =>
            op.id === recentOp.id
              ? { ...op, data: { ...op.data, ...data }, timestamp: now }
              : op
          );
        }
      }

      const newOp: SyncOperation = {
        id,
        type,
        collection,
        documentId,
        data,
        timestamp: now,
        retryCount: 0,
        maxRetries: MAX_RETRIES,
        status: "pending"
      };

      return [...prev, newOp];
    });

    return id;
  }, []);

  const removeOperation = useCallback((id: string) => {
    setQueue(prev => prev.filter(op => op.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setLastSyncTime(Date.now());
    setStatus("success");

    setTimeout(() => {
      setStatus("idle");
    }, 2000);
  }, []);

  const retryOperation = useCallback((id: string) => {
    setQueue(prev => prev.map(op =>
      op.id === id ? { ...op, status: "pending" as const, retryCount: 0, error: undefined } : op
    ));

    // Trigger sync
    processQueue();
  }, []);

  // ============================================================================
  // SYNC PROCESSING
  // ============================================================================

  const processQueue = useCallback(async () => {
    // Prevent concurrent sync operations
    if (syncInProgress.current) {
      console.log("[Sync] Sync already in progress, skipping");
      return;
    }

    const uid = userIdRef.current;
    if (!uid) {
      console.log("[Sync] No user, skipping sync");
      return;
    }

    syncInProgress.current = true;
    setStatus("syncing");

    const pendingOps = queue.filter(op => op.status === "pending");

    if (pendingOps.length === 0) {
      syncInProgress.current = false;
      setStatus("success");
      setLastSyncTime(Date.now());
      return;
    }

    // Show sync progress toast
    const syncToastId = toast.loading(`Syncing ${pendingOps.length} changes...`, {
      duration: Infinity,
    });

    let successCount = 0;
    let failCount = 0;

    for (const operation of pendingOps) {
      // Update operation status to syncing
      setQueue(prev => prev.map(op =>
        op.id === operation.id ? { ...op, status: "syncing" } : op
      ));

      try {
        await executeOperation(operation, uid);

        // Mark as completed
        setQueue(prev => prev.filter(op => op.id !== operation.id));
        successCount++;

        // Update toast message
        toast.message(`Synced ${successCount}/${pendingOps.length} changes...`, {
          id: syncToastId,
          duration: Infinity,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setLastError(errorMessage);

        // Check if we should retry
        if (operation.retryCount < operation.maxRetries) {
          setQueue(prev => prev.map(op =>
            op.id === operation.id
              ? { ...op, status: "pending" as const, retryCount: op.retryCount + 1, error: errorMessage }
              : op
          ));
        } else {
          // Max retries reached, mark as failed
          setQueue(prev => prev.map(op =>
            op.id === operation.id ? { ...op, status: "failed" as const, error: errorMessage } : op
          ));
          failCount++;
        }
      }
    }

    // Complete sync
    toast.dismiss(syncToastId);

    if (failCount > 0) {
      setStatus("error");
      toast.error(`${failCount} changes failed to sync`, {
        description: "Tap to retry or check your connection",
        duration: 5000,
      });
    } else {
      setStatus("success");
      setLastSyncTime(Date.now());

      if (successCount > 0) {
        toast.success(`All ${successCount} changes synced! ✅`, {
          duration: 3000,
        });
      }
    }

    syncInProgress.current = false;
  }, [queue]);

  // Process data to restore Firestore specific types (timestamps, increments)
  const processData = (data: Record<string, unknown>): Record<string, unknown> => {
    const processed = { ...data };

    Object.keys(processed).forEach(key => {
      const value = processed[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const anyValue = value as any;
        if (anyValue.__type === 'increment') {
          processed[key] = increment(anyValue.value);
        } else if (anyValue.__type === 'serverTimestamp') {
          processed[key] = serverTimestamp();
        }
      }
    });

    return processed;
  };

  const executeOperation = async (operation: SyncOperation, uid: string): Promise<void> => {
    const { type, collection, documentId, data } = operation;

    // Determine the correct document reference
    let docRef;
    if (collection === "user") {
      // If updating user profile, target the root user document
      docRef = doc(db, "users", uid);
    } else {
      // Otherwise target the subcollection (tasks, goals, etc)
      const collectionPath = `users/${uid}/${collection}`;
      docRef = doc(db, collectionPath, documentId);
    }

    // Process data to handle special fields like increment
    const processedData = data ? processData(data) : undefined;

    switch (type) {
      case "CREATE":
        await setDoc(docRef, {
          ...processedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        break;

      case "UPDATE":
        await updateDoc(docRef, {
          ...processedData,
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        break;

      case "DELETE":
        await deleteDoc(docRef);
        break;

      case "TOGGLE":
        await updateDoc(docRef, {
          ...processedData,
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>);
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  };

  const forceSync = useCallback(() => {
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }
    processQueue();
  }, [processQueue]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const stats = useMemo(() => ({
    totalOperations: queue.length,
    pendingOperations: queue.filter(op => op.status === "pending").length,
    completedOperations: queue.filter(op => op.status === "completed").length,
    failedOperations: queue.filter(op => op.status === "failed").length,
    lastSyncTime,
    lastError,
  }), [queue, lastSyncTime, lastError]);

  const pendingCount = stats.pendingOperations;
  const isSyncing = status === "syncing";

  // ============================================================================
  // PROVIDER VALUE
  // ============================================================================

  const value: SyncContextType = {
    status,
    isOnline,
    isSyncing,
    stats,
    pendingCount,
    queue,
    addOperation,
    removeOperation,
    clearQueue,
    retryOperation,
    forceSync,
    showStatus,
    setShowStatus,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
};

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export type { SyncStatus as Status };
export type { SyncOperation as Operation };
