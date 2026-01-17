"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTask } from "@/context/TaskContext";
import { useAI } from "@/context/AIContext";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface ParsedTask {
    title: string;
    startTime: string;
    endTime: string;
    days: string[];
    icon: string;
    timeBlock: string;
}

interface ScheduleUploaderProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScheduleUploader: React.FC<ScheduleUploaderProps> = ({ isOpen, onClose }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addTask } = useTask();
    const { aiPlatform } = useAI();

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        setIsLoading(true);
        setError(null);
        setParsedTasks([]);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("platform", aiPlatform);

            const response = await fetch("/api/ai/parse-schedule", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to parse schedule");
            }

            setParsedTasks(data.tasks);
        } catch (err: any) {
            setError(err.message || "Failed to parse schedule. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const addAllTasks = async () => {
        setIsLoading(true);
        try {
            for (const task of parsedTasks) {
                await addTask({
                    title: task.title,
                    icon: task.icon,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    timeBlock: task.timeBlock as any,
                    days: task.days,
                });
            }
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setParsedTasks([]);
                setPreview(null);
            }, 1500);
        } catch (err) {
            setError("Failed to add tasks. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeTask = (index: number) => {
        setParsedTasks((prev) => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300" onClick={onClose} />

            {/* Modal */}
            <div className="glass-premium relative z-10 w-full max-w-lg rounded-[2rem] border-white/20 p-8 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Import Schedule</h2>
                        <p className="text-sm font-medium text-muted-foreground mt-1">Upload a photo of your class routine</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="neu-icon-btn h-10 w-10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Upload Area */}
                {!preview && (
                    <div
                        className={cn(
                            "relative rounded-[2rem] border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer group",
                            isDragging
                                ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                                : "border-white/20 hover:border-purple-500/50 hover:bg-white/5"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileInput}
                        />
                        <div className="flex flex-col items-center gap-5">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] neu-convex group-hover:scale-110 transition-transform duration-300 text-purple-500">
                                <ImageIcon className="h-10 w-10" />
                            </div>
                            <div>
                                <p className="text-foreground font-bold text-lg mb-1">Drop your schedule here</p>
                                <p className="text-sm text-muted-foreground">or click to browse files</p>
                            </div>
                            <div className="px-5 py-2.5 rounded-xl bg-purple-500/10 text-purple-500 text-sm font-bold border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                Choose Image
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview & Results */}
                {preview && (
                    <div className="space-y-6">
                        {/* Image Preview */}
                        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
                            <img src={preview} alt="Schedule" className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                                        <p className="text-sm font-bold text-white">Analyzing schedule...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="h-4 w-4" />
                                </div>
                                All classes added to your routine!
                            </div>
                        )}

                        {/* Parsed Tasks */}
                        {parsedTasks.length > 0 && !success && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                        Found {parsedTasks.length} classes
                                    </p>
                                </div>
                                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {parsedTasks.map((task, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                                        >
                                            <span className="text-2xl filter drop-shadow-md">{task.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{task.title}</p>
                                                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                                    {task.startTime} - {task.endTime} • <span className="text-purple-400">{task.days.join(", ")}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeTask(index)}
                                                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={addAllTasks}
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-2xl neu-convex bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold shadow-lg shadow-purple-500/20"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    ) : (
                                        <Check className="h-5 w-5 mr-2" />
                                    )}
                                    Add All to Routine
                                </Button>
                            </div>
                        )}

                        {/* Try Again Button */}
                        {(error || parsedTasks.length === 0) && !isLoading && (
                            <Button
                                onClick={() => { setPreview(null); setError(null); }}
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-white/10 hover:bg-white/5 hover:text-foreground text-muted-foreground font-medium transition-colors"
                            >
                                Try Different Image
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
