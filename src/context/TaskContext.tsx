// ============================================================================
// TASK CONTEXT (FIXED & ENHANCED)
// ============================================================================
// Fixed version with SSR protection, sync integration, and better error handling

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { format, subDays } from "date-fns";
import { db } from "@/lib/firebase";
import { withRetry, handleFirestoreError, showSuccess, showOptimisticToast, showUndoableToast, showCelebrationToast } from "@/lib/firestoreUtils";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useSync } from "@/context/SyncContext";

// ============================================================================
// SSR-SAFE UTILS
// ============================================================================

function isClient(): boolean {
  return typeof window !== "undefined";
}

function getStorageItem(key: string): string | null {
  if (!isClient()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    console.warn(`Failed to set localStorage: ${key}`);
  }
}

// ============================================================================
// TYPES
// ============================================================================

export type TimeBlock = "Dawn" | "Morning" | "Noon" | "Afternoon" | "Evening" | "Night";

export interface Task {
  id: string;
  title: string;
  icon: string;
  startTime: string;
  endTime: string;
  timeBlock: TimeBlock;
  days: string[];
  isCompleted: boolean;
  lastCompletedDate?: string;
  completionHistory: string[];
  specificDate?: string;
  reminder?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "isCompleted" | "completionHistory">) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  resetDay: () => Promise<void>;
  getTasksByTimeBlock: (block: TimeBlock, day?: string) => Task[];
  dailyProgress: number;
  totalTasksToday: number;
  completedTasksToday: number;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  todayDate: Date;
  saveAsTemplate: (name: string) => Promise<void>;
  applyTemplate: (templateName: string) => Promise<void>;
  templates: Record<string, Task[]>;
  replaceAllTasks: (newTasks: Task[]) => Promise<void>;
  calculateStreak: (task: Task) => number;
  getCompletionRate: (days?: number) => number;
  isOnline: boolean;
  loading: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addOperation } = useSync();

  // Local State - Initialize with empty arrays for SSR safety
  const [tasks, setTasks] = useState<Task[]>([]);
  // Initialize with empty string to avoid hydration mismatch (client vs server time)
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [todayDate, setTodayDate] = useState<Date>(new Date());
  const [templates, setTemplates] = useState<Record<string, Task[]>>({});

  // Initialize dates on client side to ensure consistency
  useEffect(() => {
    setSelectedDay(format(new Date(), "EEE").toUpperCase());
    setTodayDate(new Date());
  }, []);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Refs
  const mountedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ============================================================================
  // SSR-SAFE ONLINE STATUS
  // ============================================================================

  useEffect(() => {
    if (!isClient()) return;

    const updateOnlineStatus = (online: boolean) => {
      setIsOnline(online);
    };

    // Initial check
    updateOnlineStatus(navigator.onLine);

    // Event listeners
    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ============================================================================
  // FIRESTORE LISTENERS
  // ============================================================================

  useEffect(() => {
    // Skip if no user or not mounted
    if (!user || !isClient()) {
      if (!user) {
        setTasks([]);
        setTemplates({});
        setLoading(false);
      }
      return;
    }

    // Mark as mounted
    mountedRef.current = true;

    // Load from cache first (offline support)
    try {
      const cachedTasks = getStorageItem(`rt_tasks_${user.uid}`);
      const cachedTemplates = getStorageItem(`rt_templates_${user.uid}`);

      if (cachedTasks) {
        const parsed = JSON.parse(cachedTasks);
        setTasks(parsed);
      }
      if (cachedTemplates) {
        const parsed = JSON.parse(cachedTemplates);
        setTemplates(parsed);
      }

      // Critical: If we have cached data and we're offline, stop loading
      if ((cachedTasks || cachedTemplates) && !navigator.onLine) {
        setLoading(false);
      }
    } catch (e) {
      console.warn("Failed to load cached tasks:", e);
    }

    // References to Firestore collections
    const tasksRef = collection(db, "users", user.uid, "tasks");
    const templatesRef = collection(db, "users", user.uid, "templates");

    // Task listener with SSR-safe snapshot handling
    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      // Skip if not mounted
      if (!mountedRef.current) return;

      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));

      // Only update if we have data OR if we're online
      // This prevents overwriting cached data with empty snapshots when offline
      if (fetchedTasks.length > 0 || navigator.onLine) {
        setTasks(fetchedTasks);

        // Update cache
        try {
          setStorageItem(`rt_tasks_${user.uid}`, JSON.stringify(fetchedTasks));
        } catch (e) {
          console.warn("Failed to cache tasks:", e);
        }
      }

      setLoading(false);
    }, (error) => {
      console.error("Firestore Tasks Error:", error);
      // If offline, keep cached data
      if (!navigator.onLine) {
        setLoading(false);
      }
    });

    // Templates listener
    const unsubscribeTemplates = onSnapshot(templatesRef, (snapshot) => {
      if (!mountedRef.current) return;

      const fetchedTemplates: Record<string, Task[]> = {};
      snapshot.docs.forEach(doc => {
        fetchedTemplates[doc.id] = doc.data().tasks as Task[];
      });

      if (Object.keys(fetchedTemplates).length > 0 || navigator.onLine) {
        setTemplates(fetchedTemplates);

        try {
          setStorageItem(`rt_templates_${user.uid}`, JSON.stringify(fetchedTemplates));
        } catch (e) {
          console.warn("Failed to cache templates:", e);
        }
      }
    }, (error) => {
      console.error("Firestore Templates Error:", error);
    });

    // Cleanup on unmount or user change
    unsubscribeRef.current = () => {
      unsubscribeTasks();
      unsubscribeTemplates();
    };

    return () => {
      mountedRef.current = false;
      unsubscribeRef.current?.();
    };
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS (WITH SYNC INTEGRATION)
  // ============================================================================

  const getDateForDayOfWeek = useCallback((dayName: string): string => {
    const today = new Date();
    const todayDayIndex = today.getDay();
    const dayNameToIndex: Record<string, number> = {
      "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
    };
    const targetDayIndex = dayNameToIndex[dayName] ?? 1;
    const diff = targetDayIndex - todayDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return format(targetDate, "yyyy-MM-dd");
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, "id" | "isCompleted" | "completionHistory">) => {
    if (!user) return;

    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      isCompleted: false,
      completionHistory: []
    };

    // OPTIMISTIC: Add to local state immediately
    setTasks(prev => [...prev, newTask]);
    showSuccess(`Task created! ${newTask.icon || "✅"}`);

    // Sanitize for Firestore
    const firestoreData = { ...newTask };
    Object.keys(firestoreData).forEach(key => {
      if (firestoreData[key as keyof Task] === undefined) {
        delete firestoreData[key as keyof Task];
      }
    });

    // Queue for background sync
    addOperation("CREATE", "tasks", newTask.id, firestoreData);
  }, [user, addOperation]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!user) return;

    // OPTIMISTIC: Update local state immediately
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    // Sanitize data
    const dataToSave = { ...updatedTask };
    Object.keys(dataToSave).forEach(key => {
      if (dataToSave[key as keyof Task] === undefined) {
        delete dataToSave[key as keyof Task];
      }
    });

    // Queue for background sync
    addOperation("UPDATE", "tasks", updatedTask.id, dataToSave);
  }, [user, addOperation]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;

    const deletedTask = tasks.find(t => t.id === id);
    if (!deletedTask) return;

    // OPTIMISTIC: Remove from local state immediately
    setTasks(prev => prev.filter(t => t.id !== id));

    // Queue for background sync
    addOperation("DELETE", "tasks", id);

    showUndoableToast(
      `Task deleted ${deletedTask.icon || "🗑️"}`,
      () => { }, // Action already queued, no double confirm needed for background sync
      () => {
        // Undo action
        setTasks(prev => [...prev, deletedTask]);
        // We would ideally cancel the sync op, but since we can't easily remove from queue by ID here without tracking it,
        // we'll just re-add it. Actually SyncContext logic implies we should just re-create it.
        // Simpler approach for now: Re-create via addOperation if it was deleted.
        // But since we just want to look 'instant', we can just re-add to UI.
        // AND queue a re-creation (or cancellation of delete if possible, but easier to just queue CREATE).
        // Actually, if we just queue a CREATE with the old data, it fixes it.
        const restoreData = { ...deletedTask };
        addOperation("CREATE", "tasks", restoreData.id, restoreData as unknown as Record<string, unknown>);
      }
    );
  }, [user, tasks, addOperation]);

  const toggleTaskCompletion = useCallback(async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Use the date corresponding to the currently selected day
    const completionDateStr = getDateForDayOfWeek(selectedDay);
    const isCurrentlyCompleted = task.completionHistory.includes(completionDateStr);

    const newHistory = isCurrentlyCompleted
      ? task.completionHistory.filter((d) => d !== completionDateStr)
      : [...task.completionHistory, completionDateStr];

    const updates = {
      completionHistory: newHistory,
      isCompleted: !isCurrentlyCompleted,
      lastCompletedDate: !isCurrentlyCompleted ? new Date().toISOString() : undefined,
    };

    // OPTIMISTIC: Update local state immediately
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));

    if (!isCurrentlyCompleted) {
      showCelebrationToast(task.title, 10);

      // Also update user stats optimistically/background
      const scoreChange = 10;
      // We can queue user update too
      addOperation("UPDATE", "user", user.uid, {
        score: { __type: "increment", value: scoreChange },
        lastActive: new Date().toISOString()
      });
    } else {
      const scoreChange = -10;
      addOperation("UPDATE", "user", user.uid, {
        score: { __type: "increment", value: scoreChange },
        lastActive: new Date().toISOString()
      });
    }

    // Queue for background sync
    addOperation("TOGGLE", "tasks", id, updates);
  }, [user, tasks, addOperation, selectedDay, getDateForDayOfWeek]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getTasksByTimeBlock = useCallback((block: TimeBlock, day: string = selectedDay) => {
    const dateStrForDay = getDateForDayOfWeek(day);
    return tasks
      .filter((t) => {
        if (t.specificDate) {
          return t.timeBlock === block && t.specificDate === dateStrForDay;
        }
        return t.timeBlock === block && t.days.includes(day);
      })
      .map((t) => ({
        ...t,
        isCompleted: t.completionHistory.includes(dateStrForDay)
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, selectedDay, getDateForDayOfWeek]);

  const resetDay = useCallback(async () => {
    if (!user) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const batch = writeBatch(db);

    tasks.forEach(t => {
      const newHistory = t.completionHistory.filter(d => d !== todayStr);
      if (newHistory.length !== t.completionHistory.length || t.isCompleted) {
        const ref = doc(db, "users", user.uid, "tasks", t.id);
        batch.update(ref, {
          isCompleted: false,
          lastCompletedDate: null,
          completionHistory: newHistory
        });
      }
    });

    await batch.commit();
  }, [user, tasks]);

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  const sanitizeTasks = useCallback((tasksToSanitize: Task[]) => {
    return tasksToSanitize.map(t => {
      const sanitized = { ...t };
      if (sanitized.reminder === undefined) delete sanitized.reminder;
      if (sanitized.lastCompletedDate === undefined) delete sanitized.lastCompletedDate;
      return sanitized;
    });
  }, []);

  const saveAsTemplate = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const sanitizedTasks = sanitizeTasks(tasks);
      await withRetry(
        () => setDoc(doc(db, "users", user.uid, "templates", name), { tasks: sanitizedTasks }),
        { operationName: "Save template" }
      );
      showSuccess("Template saved!", `"${name}" is ready to use`);
    } catch (error: any) {
      handleFirestoreError(error, "Save template");
    }
  }, [user, tasks, sanitizeTasks]);

  const replaceAllTasks = useCallback(async (newTasks: Task[]) => {
    if (!user) return;
    const batch = writeBatch(db);

    tasks.forEach(t => {
      batch.delete(doc(db, "users", user.uid, "tasks", t.id));
    });

    sanitizeTasks(newTasks).forEach(t => {
      batch.set(doc(db, "users", user.uid, "tasks", t.id), t);
    });

    try {
      await withRetry(
        () => batch.commit(),
        { operationName: "Apply template" }
      );
    } catch (error: any) {
      handleFirestoreError(error, "Apply template");
    }
  }, [user, tasks, sanitizeTasks]);

  const applyTemplate = useCallback(async (templateName: string) => {
    if (!user || !templates[templateName]) return;

    const newTasks = templates[templateName].map(t => ({
      ...t,
      id: uuidv4(),
      isCompleted: false,
      lastCompletedDate: undefined,
      completionHistory: []
    }));

    await replaceAllTasks(newTasks);
  }, [user, templates, replaceAllTasks]);

  // ============================================================================
  // STATS
  // ============================================================================

  const calculateStreak = useCallback((task: Task): number => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const dateToCheck = subDays(today, i);
      const dateStr = format(dateToCheck, "yyyy-MM-dd");
      const dayName = format(dateToCheck, "EEE").toUpperCase();

      if (!task.days.includes(dayName)) continue;

      if (task.completionHistory.includes(dateStr)) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  }, []);

  const getCompletionRate = useCallback((days: number = 7): number => {
    if (tasks.length === 0) return 0;
    let totalScheduled = 0;
    let totalCompleted = 0;
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const dateToCheck = subDays(today, i);
      const dateStr = format(dateToCheck, "yyyy-MM-dd");
      const dayName = format(dateToCheck, "EEE").toUpperCase();

      tasks.forEach(task => {
        if (task.days.includes(dayName)) {
          totalScheduled++;
          if (task.completionHistory.includes(dateStr)) {
            totalCompleted++;
          }
        }
      });
    }

    return totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100);
  }, [tasks]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const dateStrForSelectedDay = getDateForDayOfWeek(selectedDay);
  const todaysTasks = tasks
    .filter((t) => t.days.includes(selectedDay))
    .map((t) => ({
      ...t,
      isCompleted: t.completionHistory.includes(dateStrForSelectedDay)
    }));
  const totalTasksToday = todaysTasks.length;
  const completedTasksToday = todaysTasks.filter((t) => t.isCompleted).length;

  const dailyProgress = totalTasksToday > 0
    ? Math.round((completedTasksToday / totalTasksToday) * 100)
    : 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      resetDay,
      getTasksByTimeBlock,
      dailyProgress,
      totalTasksToday,
      completedTasksToday,
      selectedDay,
      setSelectedDay,
      todayDate,
      saveAsTemplate,
      applyTemplate,
      templates,
      replaceAllTasks,
      calculateStreak,
      getCompletionRate,
      isOnline,
      loading
    }}>
      {children}
    </TaskContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
