// ============================================================================
// ENHANCED OFFLINE QUEUE & SYNC MANAGER
// ============================================================================
// Fixed version with proper SSR protection, deduplication, and better error handling

import { toast } from "sonner";

// Operation types
export type OperationType = "ADD" | "UPDATE" | "DELETE" | "TOGGLE";

export interface PendingOperation {
    id: string;
    type: OperationType;
    collection: string;
    documentId: string;
    data?: Record<string, unknown>;
    timestamp: number;
    retryCount: number;
    status: "pending" | "syncing" | "completed" | "failed";
    error?: string;
}

const STORAGE_KEY = "rt_pending_operations";
const MAX_RETRIES = 5;
const DEDUP_WINDOW_MS = 2000; // Merge updates within 2 seconds

// ============================================================================
// SSR-SAFE STORAGE UTILS
// ============================================================================

function isClient(): boolean {
    return typeof window !== "undefined";
}

function getStoredOperations(): PendingOperation[] {
    if (!isClient()) return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveOperations(operations: PendingOperation[]): void {
    if (!isClient()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
        console.error("[OfflineQueue] Failed to save operations:", error);
    }
}

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

/**
 * Add an operation to the pending queue with deduplication
 */
export function queueOperation(operation: Omit<PendingOperation, "id" | "timestamp" | "retryCount" | "status">): string {
    const operations = getStoredOperations();
    const now = Date.now();

    // Deduplication: Check for recent operations on the same document
    const recentOp = operations.find(op =>
        op.collection === operation.collection &&
        op.documentId === operation.documentId &&
        op.type !== "DELETE" && // Never deduplicate deletes
        op.type !== operation.type &&
        now - op.timestamp < DEDUP_WINDOW_MS
    );

    if (recentOp) {
        // Merge update operations
        if (operation.type === "UPDATE" && recentOp.type === "UPDATE" && operation.data) {
            const merged = operations.map(op =>
                op.id === recentOp.id
                    ? { ...op, data: { ...op.data, ...operation.data }, timestamp: now }
                    : op
            );
            saveOperations(merged);
            console.log(`[OfflineQueue] Merged update for ${operation.documentId}`);
            return recentOp.id;
        }
    }

    // Create new operation
    const newOperation: PendingOperation = {
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        retryCount: 0,
        status: "pending",
    };

    operations.push(newOperation);
    saveOperations(operations);

    console.log(`[OfflineQueue] Queued ${operation.type} for ${operation.documentId}`);
    return newOperation.id;
}

/**
 * Remove a completed operation from the queue
 */
export function removeOperation(operationId: string): void {
    const operations = getStoredOperations();
    const filtered = operations.filter(op => op.id !== operationId);
    saveOperations(filtered);
}

/**
 * Mark operation as syncing
 */
export function markOperationSyncing(operationId: string): boolean {
    const operations = getStoredOperations();
    const operation = operations.find(op => op.id === operationId);

    if (operation) {
        operation.status = "syncing";
        saveOperations(operations);
        return true;
    }

    return false;
}

/**
 * Mark operation as completed
 */
export function markOperationCompleted(operationId: string): void {
    const operations = getStoredOperations();
    const filtered = operations.filter(op => op.id !== operationId);
    saveOperations(filtered);
}

/**
 * Mark operation as failed (increment retry count)
 */
export function markOperationFailed(operationId: string): { shouldRetry: boolean; permanentFailure: boolean } {
    const operations = getStoredOperations();
    const operation = operations.find(op => op.id === operationId);

    if (operation) {
        operation.retryCount++;

        if (operation.retryCount >= MAX_RETRIES) {
            // Permanent failure - remove operation
            const filtered = operations.filter(op => op.id !== operationId);
            saveOperations(filtered);
            return { shouldRetry: false, permanentFailure: true };
        }

        operation.status = "pending";
        operation.error = `Retry ${operation.retryCount}/${MAX_RETRIES}`;
        saveOperations(operations);
        return { shouldRetry: true, permanentFailure: false };
    }

    return { shouldRetry: false, permanentFailure: true };
}

/**
 * Update operation data (for retry with new data)
 */
export function updateOperationData(operationId: string, data: Record<string, unknown>): boolean {
    const operations = getStoredOperations();
    const operation = operations.find(op => op.id === operationId);

    if (operation) {
        operation.data = data;
        operation.status = "pending";
        operation.retryCount = 0;
        operation.error = undefined;
        saveOperations(operations);
        return true;
    }

    return false;
}

/**
 * Clear all pending operations
 */
export function clearAllOperations(): void {
    if (!isClient()) return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if there are pending operations
 */
export function hasPendingOperations(): boolean {
    return getStoredOperations().some(op => op.status === "pending");
}

/**
 * Get count of pending operations
 */
export function getPendingCount(): number {
    return getStoredOperations().filter(op => op.status === "pending").length;
}

/**
 * Get all pending operations
 */
export function getOperations(): PendingOperation[] {
    return getStoredOperations();
}

/**
 * Get operations by collection
 */
export function getOperationsByCollection(collection: string): PendingOperation[] {
    return getStoredOperations().filter(op => op.collection === collection);
}

// ============================================================================
// ONLINE/OFFLINE DETECTION (FIXED)
// ============================================================================

let isOnline = isClient() ? navigator.onLine : true;
let syncCallback: (() => Promise<void>) | null = null;
let cleanupFn: (() => void) | null = null;

/**
 * Initialize online/offline listeners (SSR-safe)
 */
export function initializeOfflineDetection(onSync: () => Promise<void>): () => void {
    if (!isClient()) {
        return () => { };
    }

    syncCallback = onSync;

    const handleOnline = async () => {
        isOnline = true;
        console.log("[OfflineQueue] Connection restored");

        const pendingCount = getPendingCount();
        
        if (pendingCount > 0) {
            toast.info("Connection restored", {
                description: `Preparing to sync ${pendingCount} changes...`,
                duration: 2000,
            });

            try {
                await onSync();
            } catch (error) {
                console.error("[OfflineQueue] Sync failed:", error);
            }
        }
    };

    const handleOffline = () => {
        isOnline = false;
        console.log("[OfflineQueue] Connection lost");
        toast.warning("You're offline", {
            description: "Changes will be saved and synced when you reconnect.",
            duration: 5000,
        });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    cleanupFn = () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        syncCallback = null;
    };

    return cleanupFn;
}

/**
 * Check if currently online (SSR-safe)
 */
export function getOnlineStatus(): boolean {
    return isClient() ? isOnline : true;
}

/**
 * Check if we should queue instead of executing directly (SSR-safe)
 */
export function shouldQueueOperation(): boolean {
    return !isClient() ? false : !isOnline;
}

// ============================================================================
// STORAGE EVENT SYNC (TAB-to-Tab Communication)
// ============================================================================

export function initializeStorageSync(): () => void {
    if (!isClient()) return () => { };

    const handleStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
            // Queue updated in another tab - could trigger refresh
            console.log("[OfflineQueue] Queue updated in another tab");
            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent("rt-sync-queue-updated"));
        }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
        window.removeEventListener("storage", handleStorage);
    };
}

// ============================================================================
// EXPORTS
// ============================================================================
// All functions and types are already exported at their definition sites
// No additional exports needed here
