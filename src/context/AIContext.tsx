"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useTask } from "./TaskContext";
import { useGoal } from "./GoalContext";
import { useAuth } from "./AuthContext";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { useUI } from "./UIContext";
import { useNotification } from "./NotificationContext";
import { useAnalytics } from "./AnalyticsContext";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

// ============================================================================
// AI CONTEXT
// ============================================================================
// This context manages the AI assistant state and interactions.

export type AIPlatform = "gemini" | "groq";

interface AIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    action?: any;
}

interface AIContextType {
    messages: AIMessage[];
    isLoading: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    sendMessage: (message: string) => Promise<void>;
    clearMessages: () => void;
    getMotivation: () => Promise<string>;
    // Settings
    aiEnabled: boolean;
    setAiEnabled: (enabled: boolean) => void;
    aiPlatform: AIPlatform;
    setAiPlatform: (platform: AIPlatform) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [aiEnabled, setAiEnabledState] = useState(true);
    const [aiPlatform, setAiPlatformState] = useState<AIPlatform>("gemini");
    const { tasks, addTask, toggleTaskCompletion, deleteTask, updateTask } = useTask();
    const { goals, addGoal, deleteGoal, updateGoal } = useGoal();
    const { user, logout } = useAuth();
    const { toggleTimer, linkTask, isActive: timerIsActive, resetTimer } = useFocusTimer();
    const { toggleSidebar, setSettingsOpen, setTaskModalOpen, isSidebarOpen, isSettingsOpen, isTaskModalOpen } = useUI();
    const { markAllAsRead, clearAll: clearNotifications, addActionableNotification } = useNotification();
    const { productivityScore, currentStreak, getInsights, totalTasksCompleted } = useAnalytics();
    const { setTheme, theme } = useTheme();
    const router = useRouter();

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const savedEnabled = localStorage.getItem("ai_enabled");
            const savedPlatform = localStorage.getItem("ai_platform") as AIPlatform;
            if (savedEnabled !== null) {
                setAiEnabledState(savedEnabled === "true");
            }
            if (savedPlatform === "gemini" || savedPlatform === "groq") {
                setAiPlatformState(savedPlatform);
            }
        } catch (e) {
            console.warn("AIContext: LocalStorage access denied", e);
        }
    }, []);

    // Setters that also save to localStorage
    const setAiEnabled = (enabled: boolean) => {
        setAiEnabledState(enabled);
        try {
            localStorage.setItem("ai_enabled", String(enabled));
        } catch (e) { }
    };

    const setAiPlatform = (platform: AIPlatform) => {
        setAiPlatformState(platform);
        try {
            localStorage.setItem("ai_platform", platform);
        } catch (e) { }
    };

    // Get the appropriate API endpoint based on platform
    const getChatEndpoint = () => aiPlatform === "groq" ? "/api/ai/groq-chat" : "/api/ai/chat";
    const getMotivationEndpoint = () => aiPlatform === "groq" ? "/api/ai/groq-motivation" : "/api/ai/motivation";

    // Send a message to the AI
    const sendMessage = useCallback(async (message: string) => {
        if (!message.trim()) return;
        if (!aiEnabled) {
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "AI is currently disabled. Enable it in Settings to use this feature.",
                timestamp: new Date(),
            }]);
            return;
        }

        // Add user message
        const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: "user",
            content: message,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Include conversation history for context memory
            const conversationHistory = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Get current date from browser for accurate AI responses
            const now = new Date();
            const currentDate = now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            const response = await fetch(getChatEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    currentDate, // Send real-time date from browser
                    context: {
                        tasks: tasks.slice(0, 20), // Send more tasks for better context
                        goals: goals.slice(0, 10),
                        analytics: {
                            productivityScore,
                            currentStreak,
                            totalTasksCompleted,
                            insights: getInsights().map(i => i.message)
                        }
                    },
                    conversationHistory,
                }),
            });

            const text = await response.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                // If parsing fails, it's likely a 500 HTML error or empty response
                console.error("Failed to parse AI response:", text.substring(0, 200));
                throw new Error(`Server Error (${response.status}): The AI service is currently unavailable. Please check server logs.`);
            }

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            // Add AI response
            const aiMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message,
                timestamp: new Date(),
                action: data.action,
            };
            setMessages((prev) => [...prev, aiMessage]);

            // Handle actions
            if (data.action) {
                if (data.action.action === "CREATE_TASK" && data.action.task) {
                    const task = data.action.task;
                    await addTask({
                        title: task.title,
                        icon: task.icon || "✅",
                        startTime: task.startTime || "09:00",
                        endTime: task.endTime || "10:00",
                        timeBlock: task.timeBlock || "Morning",
                        days: task.days || (task.specificDate ? [] : ["MON", "TUE", "WED", "THU", "FRI"]),
                        specificDate: task.specificDate, // Support calendar-specific dates
                    });
                }

                // Handle Goal Creation
                if (data.action.action === "CREATE_GOAL" && data.action.goal) {
                    const goal = data.action.goal;
                    await addGoal({
                        title: goal.title,
                        description: goal.description || "Goal created by AI Assistant",
                        category: goal.category || "Personal",
                        targetDate: goal.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
                    });
                }

                // Handle Task Completion
                if (data.action.action === "COMPLETE_TASK" && data.action.taskId) {
                    await toggleTaskCompletion(data.action.taskId);
                }

                // Handle Task Deletion
                if (data.action.action === "DELETE_TASK" && data.action.taskId) {
                    await deleteTask(data.action.taskId);
                }

                // Handle Task Editing
                if (data.action.action === "EDIT_TASK" && data.action.taskId && data.action.updates) {
                    const existingTask = tasks.find((t: any) => t.id === data.action.taskId);
                    if (existingTask) {
                        await updateTask({
                            ...existingTask,
                            ...data.action.updates
                        });
                    }
                }
                if (data.action.action === "DELETE_GOAL" && data.action.goalId) {
                    await deleteGoal(data.action.goalId);
                }
                if (data.action.action === "EDIT_GOAL" && data.action.goalId && data.action.updates) {
                    const goalToEdit = goals.find(g => g.id === data.action.goalId);
                    if (goalToEdit) {
                        await updateGoal({ ...goalToEdit, ...data.action.updates });
                    }
                }
                if (data.action.action === "START_TIMER") {
                    if (!timerIsActive) {
                        // Optional: Link task if provided
                        if (data.action.taskTitle) {
                            // We need to implement linkTaskTitle or similar if supported, 
                            // or just start the timer. 
                            // Assuming linkTask takes an ID, we might need to find the task first.
                            const task = tasks.find(t => t.title.toLowerCase() === data.action.taskTitle.toLowerCase());
                            if (task) {
                                linkTask(task.id, task.title);
                            }
                        }

                        // Set duration if provided (e.g. 25)
                        if (data.action.focusMinutes) {
                            // This requires mapping minutes to a preset or setting custom time
                            // For simplicity, just toggle for now or use 'classic' (25m)
                            // changePreset might handle this if we passed ID.
                        }

                        toggleTimer();
                    }
                }
                if (data.action.action === "STOP_TIMER") {
                    if (timerIsActive) {
                        toggleTimer();
                    }
                }
                if (data.action.action === "RESET_TIMER") {
                    resetTimer();
                }

                // UI CONTROL HANDLERS
                if (data.action.action === "UI_CONTROL") {
                    const { target, value } = data.action;

                    // Sidebar Control
                    if (target === "sidebar") {
                        if (value === "toggle") toggleSidebar();
                        else if (value === "open" && !isSidebarOpen) toggleSidebar();
                        else if (value === "close" && isSidebarOpen) toggleSidebar();
                    }

                    // Settings Modal
                    if (target === "settings") {
                        if (value === "open") setSettingsOpen(true);
                        else if (value === "close") setSettingsOpen(false);
                    }

                    // Task Modal
                    if (target === "task_modal") {
                        if (value === "open") setTaskModalOpen(true);
                        else if (value === "close") setTaskModalOpen(false);
                    }

                    // Theme Control
                    if (target === "theme") {
                        setTheme(value); // 'light', 'dark', 'system'
                    }
                }

                // NOTIFICATION HANDLERS
                if (data.action.action === "MANAGE_NOTIFICATIONS") {
                    if (data.action.command === "clear_all") clearNotifications();
                    if (data.action.command === "mark_all_read") markAllAsRead();
                }

                // AUTH HANDLERS
                if (data.action.action === "AUTH_CONTROL") {
                    if (data.action.command === "logout") {
                        await logout();
                        router.push("/auth/login"); // Ensure redirect
                    }
                }

                if (data.action.action === "UPDATE_SETTINGS" && data.action.settings) {
                    if (data.action.settings.theme) {
                        setTheme(data.action.settings.theme);
                    }
                    // Add other settings handlers here as needed
                }

                if (data.action.action === "GET_ANALYTICS") {
                    // The AI already has analytics in context, but this action 
                    // allows it to explicitly "show" or "fetch" fresh data if we add a UI for it.
                    // For now, we can just acknowledge or navigate to analytics.
                    router.push("/analytics");
                }

                if (data.action.action === "NAVIGATE" && data.action.path) {
                    router.push(data.action.path);
                }
            }
        } catch (error: any) {
            const errorMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Sorry, I encountered an error: ${error.message}. Please make sure the API key is configured.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [tasks, goals, messages, addTask, addGoal, toggleTaskCompletion, deleteTask, updateTask, aiEnabled, aiPlatform, timerIsActive, toggleTimer, resetTimer, toggleSidebar, setSettingsOpen, setTaskModalOpen, setTheme, logout, markAllAsRead, clearNotifications, isSidebarOpen]);

    // Get daily motivation
    const getMotivation = useCallback(async (): Promise<string> => {
        if (!aiEnabled) {
            return "🌟 AI is disabled. Enable it in Settings for personalized motivation!";
        }
        try {
            const todayTasks = tasks.filter((t: { days?: string[] }) => {
                const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3);
                return t.days?.includes(today);
            });

            const response = await fetch(getMotivationEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tasks: todayTasks.slice(0, 5),
                    userName: user?.displayName || user?.email?.split("@")[0],
                }),
            });

            const data = await response.json();
            return data.motivation;
        } catch (error) {
            return "🌟 You've got this! Every task you complete today brings you closer to your goals!";
        }
    }, [tasks, user, aiEnabled, aiPlatform]);

    // Clear all messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return (
        <AIContext.Provider
            value={{
                messages,
                isLoading,
                isOpen,
                setIsOpen,
                sendMessage,
                clearMessages,
                getMotivation,
                aiEnabled,
                setAiEnabled,
                aiPlatform,
                setAiPlatform,
            }}
        >
            {children}
        </AIContext.Provider>
    );
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error("useAI must be used within an AIProvider");
    }
    return context;
};

