"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useSync } from "@/context/SyncContext";
import { showSuccess, showUndoableToast, showCelebrationToast } from "@/lib/firestoreUtils";

// SSR-safe utils
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

export interface Goal {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    isCompleted: boolean;
    category: string;
    progress: number; // 0-100
}

interface GoalContextType {
    goals: Goal[];
    addGoal: (goal: Omit<Goal, "id" | "isCompleted" | "progress">) => Promise<void>;
    updateGoal: (goal: Goal) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    toggleGoalCompletion: (id: string) => Promise<void>;
    loading: boolean;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { addOperation } = useSync();

    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    // Refs
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!user || !isClient()) {
            if (!user) {
                setGoals([]);
                setLoading(false);
            }
            return;
        }

        mountedRef.current = true;

        // Load cache
        try {
            const cached = getStorageItem(`rt_goals_${user.uid}`);
            if (cached) {
                setGoals(JSON.parse(cached));
                if (!navigator.onLine) setLoading(false);
            }
        } catch (e) {
            console.warn("Failed to load cached goals:", e);
        }

        const goalsRef = collection(db, "users", user.uid, "goals");
        const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
            if (!mountedRef.current) return;

            const fetchedGoals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Goal));

            if (fetchedGoals.length > 0 || navigator.onLine) {
                setGoals(fetchedGoals);
                try {
                    setStorageItem(`rt_goals_${user.uid}`, JSON.stringify(fetchedGoals));
                } catch (e) {
                    console.warn("Failed to cache goals:", e);
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Firestore Goals Error:", error);
            if (!navigator.onLine) setLoading(false);
        });

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, [user]);

    const addGoal = useCallback(async (goalData: Omit<Goal, "id" | "isCompleted" | "progress">) => {
        if (!user) return;

        const newGoal: Goal = {
            ...goalData,
            id: uuidv4(),
            isCompleted: false,
            progress: 0,
        };

        // Optimistic
        setGoals(prev => [...prev, newGoal]);
        showSuccess("Goal set!", "Go get it!");

        // Sync
        addOperation("CREATE", "goals", newGoal.id, newGoal as unknown as Record<string, unknown>);
    }, [user, addOperation]);

    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        if (!user) return;

        // Optimistic
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));

        // Sync
        addOperation("UPDATE", "goals", updatedGoal.id, updatedGoal as unknown as Record<string, unknown>);
    }, [user, addOperation]);

    const deleteGoal = useCallback(async (id: string) => {
        if (!user) return;

        const deletedGoal = goals.find(g => g.id === id);
        if (!deletedGoal) return;

        // Optimistic
        setGoals(prev => prev.filter(g => g.id !== id));

        // Sync
        addOperation("DELETE", "goals", id);

        showUndoableToast(
            "Goal deleted",
            () => {},
            () => {
                setGoals(prev => [...prev, deletedGoal]);
                addOperation("CREATE", "goals", deletedGoal.id, deletedGoal as unknown as Record<string, unknown>);
            }
        );
    }, [user, goals, addOperation]);

    const toggleGoalCompletion = useCallback(async (id: string) => {
        if (!user) return;
        const goal = goals.find((g) => g.id === id);
        if (!goal) return;

        const updates = {
            isCompleted: !goal.isCompleted,
            progress: !goal.isCompleted ? 100 : 0,
        };

        // Optimistic
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));

        if (!goal.isCompleted) {
            showCelebrationToast(goal.title);
             // Update user score
             addOperation("UPDATE", "user", user.uid, {
                score: { __type: "increment", value: 50 }, // Big points for goals
                lastActive: new Date().toISOString()
             });
        }

        // Sync
        addOperation("UPDATE", "goals", id, updates);
    }, [user, goals, addOperation]);

    return (
        <GoalContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, toggleGoalCompletion, loading }}>
            {children}
        </GoalContext.Provider>
    );
};

export const useGoal = () => {
    const context = useContext(GoalContext);
    if (context === undefined) {
        throw new Error("useGoal must be used within a GoalProvider");
    }
    return context;
};
