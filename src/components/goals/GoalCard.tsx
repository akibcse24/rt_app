"use client";

import React from "react";
import { Button, cn } from "@/components/ui/Button";
import { Target, Calendar, Trash2, Edit2, CheckCircle, Trophy } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export interface Goal {
    id: string;
    title: string;
    description: string;
    icon: string;
    targetDate: string; // ISO date string
    createdAt: string;
    milestones: Milestone[];
    linkedTaskIds: string[];
    isCompleted: boolean;
}

export interface Milestone {
    id: string;
    title: string;
    isCompleted: boolean;
}

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    onDelete: (id: string) => void;
    onToggleComplete: (id: string) => void;
    onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
    goal,
    onEdit,
    onDelete,
    onToggleComplete,
    onToggleMilestone,
}) => {
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = differenceInDays(targetDate, new Date());
    const isOverdue = isPast(targetDate) && !goal.isCompleted;

    // Safety check for milestones
    const rawMilestones = goal.milestones;
    const milestones = Array.isArray(rawMilestones) ? rawMilestones : [];

    const completedMilestones = milestones.filter(m => m.isCompleted).length;
    const totalMilestones = milestones.length;
    const progress = totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : goal.isCompleted ? 100 : 0;

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-[2rem] p-6 transition-all duration-500 hover:scale-[1.02]",
                goal.isCompleted
                    ? "neu-concave opacity-70 grayscale-[0.5]"
                    : "glass-premium hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] border-white/40"
            )}
        >
            {/* Background Glow */}
            {!goal.isCompleted && (
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex h-16 w-16 items-center justify-center rounded-[1.2rem] text-3xl transition-all duration-300",
                            goal.isCompleted
                                ? "neu-concave text-green-500/50"
                                : "neu-convex bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-foreground group-hover:scale-110"
                        )}>
                            <span className="filter drop-shadow-md">{goal.icon}</span>
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-lg font-bold tracking-tight transition-colors",
                                goal.isCompleted ? "text-green-500" : "text-foreground group-hover:text-purple-400"
                            )}>
                                {goal.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <div className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border",
                                    isOverdue
                                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                                        : "bg-white/5 border-white/10 text-muted-foreground"
                                )}>
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        {isOverdue
                                            ? `Overdue ${Math.abs(daysRemaining)} days`
                                            : daysRemaining === 0
                                                ? "Due Today"
                                                : `${daysRemaining} days left`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleComplete(goal.id)}
                            className={cn(
                                "h-10 w-10 rounded-xl transition-all neu-flat hover:neu-convex",
                                goal.isCompleted
                                    ? "text-green-500 hover:text-green-400"
                                    : "text-muted-foreground hover:text-green-400"
                            )}
                            title={goal.isCompleted ? "Mark incomplete" : "Mark complete"}
                        >
                            <Trophy className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(goal)}
                            className="h-10 w-10 rounded-xl neu-flat hover:neu-convex text-muted-foreground hover:text-purple-400 transition-all"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(goal.id)}
                            className="h-10 w-10 rounded-xl neu-flat hover:neu-convex text-muted-foreground hover:text-red-400 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Description */}
                {goal.description && (
                    <div className="neu-concave p-4 rounded-2xl mb-5">
                        <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                            {goal.description}
                        </p>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</span>
                        <span className="text-xs font-bold text-purple-400">{progress}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full neu-concave p-[2px]">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(168,85,247,0.4)]",
                                goal.isCompleted
                                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Milestones */}
                {milestones.length > 0 && (
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            Milestones ({completedMilestones}/{totalMilestones})
                        </span>
                        <div className="space-y-2">
                            {milestones.slice(0, 3).map((milestone) => (
                                <button
                                    key={milestone.id}
                                    onClick={() => onToggleMilestone(goal.id, milestone.id)}
                                    className={cn(
                                        "flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all group/milestone",
                                        milestone.isCompleted
                                            ? "neu-flat opacity-60"
                                            : "neu-convex hover:scale-[1.01]"
                                    )}
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shadow-inner",
                                        milestone.isCompleted
                                            ? "border-green-500 bg-green-500 text-white"
                                            : "border-muted-foreground/30 group-hover/milestone:border-purple-500 text-transparent"
                                    )}>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold transition-colors",
                                        milestone.isCompleted
                                            ? "text-muted-foreground line-through decoration-2 decoration-green-500/30"
                                            : "text-foreground/80 group-hover/milestone:text-foreground"
                                    )}>
                                        {milestone.title}
                                    </span>
                                </button>
                            ))}
                            {milestones.length > 3 && (
                                <p className="text-xs font-medium text-muted-foreground text-center pt-1">
                                    +{milestones.length - 3} more milestones
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Target Date Footer */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target</span>
                     <span className="text-xs font-bold text-foreground bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                        {format(targetDate, "MMM d, yyyy")}
                     </span>
                </div>
            </div>
        </div>
    );
};
