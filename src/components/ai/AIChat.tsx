"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAI } from "@/context/AIContext";
import { Bot, X, Send, Sparkles, Trash2, Loader2, Upload, Copy, Check, Maximize2, Minimize2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScheduleUploader } from "./ScheduleUploader";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Simple markdown-like rendering for bold, italic, lists
const renderMarkdown = (text: string) => {
    // Remove JSON blocks
    let clean = text.replace(/```json[\s\S]*?```/g, "").trim();

    // Bold: **text**
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points: - item or * item
    clean = clean.replace(/^[-*]\s+(.*)$/gm, '• $1');

    // Numbered lists: 1. item
    clean = clean.replace(/^\d+\.\s+(.*)$/gm, '→ $1');

    return clean;
};

// Format relative time
const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
};

export const AIChat: React.FC = () => {
    const { messages, isLoading, isOpen, setIsOpen, sendMessage, clearMessages, aiEnabled } = useAI();

    if (!aiEnabled) return null;

    const [input, setInput] = useState("");
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput("");
        }
    };

    const handleCopy = async (text: string, id: string) => {
        const cleanText = text.replace(/```json[\s\S]*?```/g, "").trim();
        await navigator.clipboard.writeText(cleanText);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleReaction = (id: string, type: "up" | "down") => {
        setReactions(prev => ({
            ...prev,
            [id]: prev[id] === type ? null : type
        }));
    };

    // Get action label
    const getActionLabel = (action: any) => {
        switch (action?.action) {
            case "CREATE_TASK": return "✅ Task created!";
            case "CREATE_GOAL": return "🎯 Goal created!";
            case "DELETE_TASK": return "🗑️ Task deleted!";
            case "EDIT_TASK": return "✏️ Task updated!";
            case "COMPLETE_TASK": return "☑️ Task completed!";
            default: return "✨ Action completed!";
        }
    };

    // Quick actions
    const quickActions = [
        { label: "➕ Add Task", prompt: "Create a task to " },
        { label: "🎯 Set Goal", prompt: "Create a goal to " },
        { label: "📅 Schedule Date", prompt: "Schedule a task on " },
        { label: "🔄 Reschedule", prompt: "Move my task to " },
        { label: "✏️ Edit Task", prompt: "Change the time of " },
        { label: "🗑️ Delete Task", prompt: "Delete the task called " },
        { label: "💪 Motivate", prompt: "Give me motivation for my tasks today" },
    ];

    // Size classes
    const sizeClasses = isFullscreen
        ? "fixed inset-4 z-50"
        : "fixed bottom-6 right-6 z-50 h-[600px] w-[420px]";

    if (!isOpen) {
        return (
            <>
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full glass-premium shadow-lg hover:shadow-purple-500/20 transition-all hover:scale-110 hover:-translate-y-1 group"
                    aria-label="Open AI Assistant"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                    <Bot className="h-8 w-8 text-purple-500 group-hover:text-purple-400 transition-colors" />
                </button>
                <ScheduleUploader isOpen={isUploaderOpen} onClose={() => setIsUploaderOpen(false)} />
            </>
        );
    }

    return (
        <>
            <div className={cn(sizeClasses, "glass-premium flex flex-col overflow-hidden rounded-[2rem] border-white/40 shadow-2xl transition-all duration-300")}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg text-white">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">RT AI</h3>
                            <p className="text-xs text-muted-foreground">
                                {isLoading ? (
                                    <span className="flex items-center gap-1 text-purple-500">
                                        <span className="animate-pulse">thinking</span>
                                        <span className="flex gap-0.5">
                                            <span className="animate-bounce delay-0">.</span>
                                            <span className="animate-bounce delay-100">.</span>
                                            <span className="animate-bounce delay-200">.</span>
                                        </span>
                                    </span>
                                ) : "Productivity Assistant"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsUploaderOpen(true)}
                            className="neu-icon-btn h-8 w-8"
                            title="Import schedule from image"
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="neu-icon-btn h-8 w-8"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearMessages}
                            className="neu-icon-btn h-8 w-8 text-red-400 hover:text-red-500"
                            title="Clear chat"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="neu-icon-btn h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="h-20 w-20 rounded-[2rem] glass-premium flex items-center justify-center mb-6 shadow-inner">
                                <Bot className="h-10 w-10 text-purple-500" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground mb-2">Hi! I'm RT AI 🌟</h4>
                            <p className="text-sm text-muted-foreground mb-8 max-w-[280px]">
                                I can help you manage tasks, set goals, schedule events, and keep you motivated!
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => setInput(action.prompt)}
                                        className="px-4 py-2 text-xs font-bold rounded-xl glass-premium hover:bg-purple-500/10 hover:border-purple-500/30 transition-all active:scale-95 text-purple-500/80 hover:text-purple-500"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsUploaderOpen(true)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl glass-premium hover:bg-pink-500/10 hover:border-pink-500/30 transition-all active:scale-95 text-pink-500/80 hover:text-pink-500 flex items-center gap-1.5"
                                >
                                    <Upload className="h-3 w-3" />
                                    Upload Schedule
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[85%] ${msg.role === "user" ? "" : "group"}`}>
                                <div
                                    className={cn(
                                        "rounded-2xl px-5 py-3.5 text-sm shadow-sm",
                                        msg.role === "user"
                                            ? "neu-convex bg-gradient-to-br from-purple-600 to-pink-600 text-white border-none"
                                            : "neu-concave text-foreground"
                                    )}
                                >
                                    <p
                                        className="whitespace-pre-wrap leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                    />
                                    {msg.action && (
                                        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-purple-500 font-bold flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" />
                                            {getActionLabel(msg.action)}
                                        </div>
                                    )}
                                </div>

                                {/* Message footer: timestamp + actions */}
                                <div className={cn(
                                    "flex items-center gap-2 mt-2 px-1",
                                    msg.role === "user" ? "justify-end" : "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                )}>
                                    <span className="text-[10px] font-medium text-muted-foreground/60">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                    {msg.role === "assistant" && (
                                        <>
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                                                title="Copy"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="h-3 w-3 text-green-400" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleReaction(msg.id, "up")}
                                                className={cn(
                                                    "p-1.5 rounded-lg hover:bg-white/5 transition-colors",
                                                    reactions[msg.id] === "up" ? "text-green-400" : "text-muted-foreground hover:text-foreground"
                                                )}
                                                title="Helpful"
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => handleReaction(msg.id, "down")}
                                                className={cn(
                                                    "p-1.5 rounded-lg hover:bg-white/5 transition-colors",
                                                    reactions[msg.id] === "down" ? "text-red-400" : "text-muted-foreground hover:text-foreground"
                                                )}
                                                title="Not helpful"
                                            >
                                                <ThumbsDown className="h-3 w-3" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="neu-concave rounded-2xl px-5 py-4 flex items-center gap-3">
                                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                                <span className="text-sm font-medium text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 rounded-2xl neu-concave bg-transparent px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "h-11 w-11 rounded-2xl p-0 transition-all duration-300",
                                !input.trim() || isLoading
                                    ? "neu-flat opacity-50 cursor-not-allowed"
                                    : "neu-convex bg-gradient-to-br from-purple-600 to-pink-600 hover:scale-105 active:scale-95 text-white shadow-lg shadow-purple-500/25"
                            )}
                        >
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    </div>
                </form>
            </div>
            <ScheduleUploader isOpen={isUploaderOpen} onClose={() => setIsUploaderOpen(false)} />
        </>
    );
};
