// ============================================================================
// ENHANCED AGENT CONTEXT SYSTEM
// ============================================================================
// Provides sliding window context management, memory persistence, and
// intelligent context compression for the AI agent.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AgentMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
    metadata?: {
        toolsUsed?: string[];
        tokensUsed?: number;
        confidence?: number;
        thoughtChain?: string[];
    };
}

export interface UserFact {
    id: string;
    category: "preference" | "habit" | "fact" | "goal";
    content: string;
    confidence: number;
    source: "explicit" | "inferred" | "behavioral";
    lastVerified: number;
    embedding?: number[];
}

export interface ContextState {
    messages: AgentMessage[];
    userFacts: UserFact[];
    currentGoal: string | null;
    sessionStart: number;
    tokenUsage: {
        prompt: number;
        completion: number;
        total: number;
    };
}

export interface AgentContextType extends ContextState {
    // Message Management
    addMessage: (role: AgentMessage["role"], content: string, metadata?: AgentMessage["metadata"]) => void;
    clearMessages: () => void;
    getRecentMessages: (count: number) => AgentMessage[];

    // Context Compression
    compressContext: () => void;
    getCompressedContext: () => Promise<string>;

    // Memory Management
    addUserFact: (fact: Omit<UserFact, "id" | "lastVerified">) => void;
    updateUserFact: (id: string, updates: Partial<UserFact>) => void;
    getUserFacts: (category?: UserFact["category"]) => UserFact[];
    inferUserFact: (content: string) => Promise<UserFact | null>;

    // Goal Tracking
    setCurrentGoal: (goal: string) => void;
    getCurrentGoal: () => string | null;

    // Token Management
    getTokenEstimate: () => number;
    isNearLimit: () => boolean;
}

// ============================================================================
// CONTEXT STORAGE (IndexedDB)
// ============================================================================

const DB_NAME = "AgentContextDB";
const DB_VERSION = 1;

interface AgentContextDB {
    messages: {
        key: string;
        value: AgentMessage;
    };
    facts: {
        key: string;
        value: UserFact;
    };
    config: {
        key: string;
        value: any;
    };
}

class ContextDatabase {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            if (typeof window === "undefined") {
                resolve();
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Messages store
                if (!db.objectStoreNames.contains("messages")) {
                    const messagesStore = db.createObjectStore("messages", { keyPath: "id" });
                    messagesStore.createIndex("timestamp", "timestamp");
                    messagesStore.createIndex("role", "role");
                }

                // Facts store
                if (!db.objectStoreNames.contains("facts")) {
                    const factsStore = db.createObjectStore("facts", { keyPath: "id" });
                    factsStore.createIndex("category", "category");
                    factsStore.createIndex("confidence", "confidence");
                }

                // Config store
                if (!db.objectStoreNames.contains("config")) {
                    db.createObjectStore("config", { keyPath: "key" });
                }
            };
        });

        return this.initPromise;
    }

    async getAll(storeName: keyof AgentContextDB): Promise<any[]> {
        await this.init();
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async put(storeName: keyof AgentContextDB, value: any): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(value);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async delete(storeName: keyof AgentContextDB, key: string): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clear(storeName: keyof AgentContextDB): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

const db = new ContextDatabase();

// ============================================================================
// DEFAULT SYSTEM PROMPT
// ============================================================================

const DEFAULT_SYSTEM_PROMPT = `You are an intelligent productivity assistant for the Routine Tracker app. Your goals are to:

1. Help users manage their daily tasks and routines effectively
2. Provide personalized suggestions based on user preferences and habits
3. Analyze productivity patterns and offer insights
4. Assist with task scheduling, prioritization, and planning

Guidelines:
- Be concise and actionable in your responses
- Ask clarifying questions when user requests are ambiguous
- Remember user preferences and apply them consistently
- Proactively suggest improvements to their routines
- Use tools when needed to complete tasks

Current capabilities:
- Task management (create, update, complete, delete)
- Focus timer control and statistics
- Achievement tracking and gamification
- Analytics and productivity insights
- Natural language task parsing

Remember: You are a productivity expert. Focus on helping users achieve their goals efficiently.`;

// ============================================================================
// AGENT CONTEXT PROVIDER
// ============================================================================

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const MAX_CONTEXT_TOKENS = 12000;
const COMPRESSION_THRESHOLD = 8000;
const RECENT_MESSAGES_COUNT = 20;

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [userFacts, setUserFacts] = useState<UserFact[]>([]);
    const [currentGoal, setCurrentGoalState] = useState<string | null>(null);
    const [sessionStart] = useState(Date.now());
    const [tokenUsage, setTokenUsage] = useState({
        prompt: 0,
        completion: 0,
        total: 0
    });

    const initialized = useRef(false);

    // Initialize from IndexedDB
    useEffect(() => {
        if (typeof window === "undefined" || initialized.current) return;
        initialized.current = true;

        const initContext = async () => {
            try {
                const [storedMessages, storedFacts] = await Promise.all([
                    db.getAll("messages"),
                    db.getAll("facts")
                ]);

                // Keep only recent messages (last 50)
                const recentMessages = (storedMessages as AgentMessage[])
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 50);

                setMessages(recentMessages);
                setUserFacts(storedFacts as UserFact[]);

                // Add system message if no messages exist
                if (recentMessages.length === 0) {
                    const systemMessage: AgentMessage = {
                        id: "system-" + Date.now(),
                        role: "system",
                        content: DEFAULT_SYSTEM_PROMPT,
                        timestamp: Date.now()
                    };
                    setMessages([systemMessage]);
                }
            } catch (error) {
                console.error("Failed to initialize agent context:", error);
            }
        };

        initContext();
    }, []);

    // ============================================================================
    // MESSAGE MANAGEMENT
    // ============================================================================

    const addMessage = useCallback((
        role: AgentMessage["role"],
        content: string,
        metadata?: AgentMessage["metadata"]
    ) => {
        const message: AgentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role,
            content,
            timestamp: Date.now(),
            metadata
        };

        setMessages(prev => {
            const updated = [message, ...prev].slice(0, 100); // Keep last 100 messages
            db.put("messages", message);
            return updated;
        });

        // Estimate and track token usage
        const estimatedTokens = Math.ceil(content.length / 4);
        if (role === "user") {
            setTokenUsage(prev => ({
                ...prev,
                prompt: prev.prompt + estimatedTokens,
                total: prev.total + estimatedTokens
            }));
        } else {
            setTokenUsage(prev => ({
                ...prev,
                completion: prev.completion + estimatedTokens,
                total: prev.total + estimatedTokens
            }));
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        db.clear("messages");

        // Re-add system message
        const systemMessage: AgentMessage = {
            id: "system-" + Date.now(),
            role: "system",
            content: DEFAULT_SYSTEM_PROMPT,
            timestamp: Date.now()
        };
        setMessages([systemMessage]);
        db.put("messages", systemMessage);
    }, []);

    const getRecentMessages = useCallback((count: number): AgentMessage[] => {
        return messages
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count)
            .reverse();
    }, [messages]);

    // ============================================================================
    // TOKEN MANAGEMENT
    // ============================================================================

    const getTokenEstimate = useCallback((): number => {
        return messages.reduce((total, msg) => {
            return total + Math.ceil(msg.content.length / 4);
        }, 0);
    }, [messages]);

    const isNearLimit = useCallback((): boolean => {
        return getTokenEstimate() > MAX_CONTEXT_TOKENS * 0.8;
    }, [getTokenEstimate]);

    // ============================================================================
    // CONTEXT COMPRESSION
    // ============================================================================

    const compressContext = useCallback(async () => {
        if (messages.length < 10) return;

        // Get user facts to inject into compressed context
        const factsSummary = userFacts
            .filter(f => f.confidence > 0.7)
            .map(f => `- ${f.content}`)
            .join("\n");

        // Compress old messages by summarizing
        const oldMessages = messages.filter(m => m.role !== "system");
        const recentMessages = messages.filter(
            (m, i) => i < 5 || m.role === "system"
        );

        if (oldMessages.length > 10) {
            // Create summary of old messages
            const summaryMessage: AgentMessage = {
                id: `summary-${Date.now()}`,
                role: "system",
                content: `[CONTEXT SUMMARY - Previous conversation included ${oldMessages.length} messages. Key user preferences: \n${factsSummary || "None recorded yet"}]`,
                timestamp: Date.now()
            };

            const newMessages = [summaryMessage, ...recentMessages];
            setMessages(newMessages);

            // Clear old messages and add summary
            await db.clear("messages");
            for (const msg of newMessages) {
                await db.put("messages", msg);
            }
        }
    }, [messages, userFacts]);

    const getCompressedContext = useCallback(async (): Promise<string> => {
        // Check if compression is needed
        if (getTokenEstimate() > COMPRESSION_THRESHOLD) {
            await compressContext();
        }

        // Get recent messages with facts
        const recentMessages = getRecentMessages(RECENT_MESSAGES_COUNT);
        const relevantFacts = userFacts.filter(f => f.confidence > 0.5);

        // Build context string
        const contextParts = recentMessages.map(m => {
            const prefix = m.role === "user" ? "User: " :
                m.role === "assistant" ? "Assistant: " : "";
            return `${prefix}${m.content}`;
        });

        if (relevantFacts.length > 0) {
            contextParts.unshift(
                `[USER PROFILE - Remember these preferences:]\n` +
                relevantFacts.map(f => `- ${f.content}`).join("\n")
            );
        }

        return contextParts.join("\n\n");
    }, [messages, userFacts, getRecentMessages, getTokenEstimate, compressContext]);

    // ============================================================================
    // MEMORY MANAGEMENT
    // ============================================================================

    const addUserFact = useCallback((fact: Omit<UserFact, "id" | "lastVerified">) => {
        const newFact: UserFact = {
            ...fact,
            id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            lastVerified: Date.now()
        };

        setUserFacts(prev => {
            const updated = [...prev, newFact];
            db.put("facts", newFact);
            return updated;
        });

        return newFact.id;
    }, []);

    const updateUserFact = useCallback(async (id: string, updates: Partial<UserFact>) => {
        setUserFacts(prev => {
            const updated = prev.map(f =>
                f.id === id ? { ...f, ...updates, lastVerified: Date.now() } : f
            );
            const fact = updated.find(f => f.id === id);
            if (fact) db.put("facts", fact);
            return updated;
        });
    }, []);

    const getUserFacts = useCallback((category?: UserFact["category"]): UserFact[] => {
        if (category) {
            return userFacts.filter(f => f.category === category);
        }
        return userFacts;
    }, [userFacts]);

    const inferUserFact = useCallback(async (content: string): Promise<UserFact | null> => {
        // Simple rule-based inference (can be enhanced with local ML)
        const inferenceRules: Array<{ pattern: RegExp; category: UserFact["category"]; template: string }> = [
            {
                pattern: /prefer|morning|evening|afternoon/i,
                category: "preference",
                template: "User prefers working in the $1"
            },
            {
                pattern: /every\s+\w+|daily|weekly|weekends/i,
                category: "habit",
                template: "User has a $1 routine"
            },
            {
                pattern: /goal|want to|strive|achieve/i,
                category: "goal",
                template: "User wants to achieve: $1"
            }
        ];

        for (const rule of inferenceRules) {
            const match = content.match(rule.pattern);
            if (match) {
                const fact: UserFact = {
                    id: `inferred-${Date.now()}`,
                    category: rule.category,
                    content: content.substring(0, 200), // Truncate if too long
                    confidence: 0.6, // Lower confidence for inferred facts
                    source: "inferred",
                    lastVerified: Date.now()
                };
                return fact;
            }
        }

        return null;
    }, []);

    // ============================================================================
    // GOAL TRACKING
    // ============================================================================

    const setCurrentGoal = useCallback((goal: string) => {
        setCurrentGoalState(goal);
    }, []);

    const getCurrentGoal = useCallback((): string | null => {
        return currentGoal;
    }, [currentGoal]);



    // ============================================================================
    // AUTO-COMPRESSION
    // ============================================================================

    useEffect(() => {
        if (isNearLimit()) {
            compressContext();
        }
    }, [messages.length, isNearLimit, compressContext]);

    // ============================================================================
    // CONTEXT VALUE
    // ============================================================================

    const value: AgentContextType = {
        messages,
        userFacts,
        currentGoal,
        sessionStart,
        tokenUsage,
        addMessage,
        clearMessages,
        getRecentMessages,
        compressContext,
        getCompressedContext,
        addUserFact,
        updateUserFact,
        getUserFacts,
        inferUserFact,
        setCurrentGoal,
        getCurrentGoal,
        getTokenEstimate,
        isNearLimit
    };

    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAgentContext = () => {
    const context = useContext(AgentContext);
    if (context === undefined) {
        throw new Error("useAgentContext must be used within an AgentProvider");
    }
    return context;
};

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const buildSystemPrompt = (
    userFacts: UserFact[],
    currentGoal: string | null
): string => {
    const factsSection = userFacts.length > 0
        ? `\n\n[USER PROFILE - These preferences have been learned about you:]\n${userFacts
            .filter(f => f.confidence > 0.5)
            .map(f => `- ${f.content}`)
            .join("\n")
        }`
        : "";

    const goalSection = currentGoal
        ? `\n\n[CURRENT GOAL - User is working towards:]\n${currentGoal}`
        : "";

    return DEFAULT_SYSTEM_PROMPT + factsSection + goalSection;
};

export const countTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
};

export default AgentContext;
