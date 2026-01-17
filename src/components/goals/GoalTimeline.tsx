"use client";

import React, { useMemo } from "react";
import { Goal } from "@/context/GoalContext";
import { format, differenceInDays, isPast, addDays } from "date-fns";
import { Target, Flag, CheckCircle, CalendarDays, Milestone } from "lucide-react";

interface GoalTimelineProps {
    goals: Goal[];
    onGoalClick?: (goal: Goal) => void;
}

export const GoalTimeline: React.FC<GoalTimelineProps> = ({ goals, onGoalClick }) => {
    // Sort goals by target date
    const sortedGoals = useMemo(() => {
        return [...goals].sort((a, b) =>
            new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
        );
    }, [goals]);

    // Find date range
    const { minDate, maxDate } = useMemo(() => {
        if (sortedGoals.length === 0) {
            return { minDate: new Date(), maxDate: addDays(new Date(), 90) };
        }

        const dates = sortedGoals.map((g) => new Date(g.targetDate));
        const now = new Date();

        return {
            minDate: now,
            maxDate: new Date(Math.max(...dates.map((d) => d.getTime()), addDays(now, 30).getTime()))
        };
    }, [sortedGoals]);

    const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);

    const getGoalStatus = (goal: Goal) => {
        if (goal.isCompleted) return "completed";
        if (isPast(new Date(goal.targetDate))) return "overdue";
        if (differenceInDays(new Date(goal.targetDate), new Date()) <= 7) return "soon";
        return "active";
    };

    const statusColors = {
        completed: "from-emerald-500 to-green-500",
        overdue: "from-red-500 to-orange-500",
        soon: "from-yellow-500 to-amber-500",
        active: "from-purple-500 to-pink-500",
    };

    const statusBg = {
        completed: "bg-emerald-500/20 border-emerald-500/30",
        overdue: "bg-red-500/20 border-red-500/30",
        soon: "bg-yellow-500/20 border-yellow-500/30",
        active: "bg-purple-500/20 border-purple-500/30",
    };

    if (goals.length === 0) {
        return (
            <div className="rounded-3xl bg-card border border-border p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">No Goals Yet</h3>
                <p className="text-sm text-muted-foreground">
                    Create goals to see your timeline visualization
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-card border border-border p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Goal Timeline</h3>
                    <p className="text-xs text-muted-foreground">
                        {format(minDate, "MMM d")} → {format(maxDate, "MMM d, yyyy")}
                    </p>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Timeline Track */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-pink-500/30 to-transparent" />

                {/* Today Marker */}
                <div className="absolute left-4 top-0 z-10">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-background">
                        <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                    <span className="absolute left-8 top-0 text-xs font-bold text-purple-400">Today</span>
                </div>

                {/* Goal Items */}
                <div className="space-y-4 pt-10">
                    {sortedGoals.map((goal) => {
                        const status = getGoalStatus(goal);
                        const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());

                        return (
                            <div
                                key={goal.id}
                                className="relative pl-12 cursor-pointer transition-all hover:translate-x-1"
                                onClick={() => onGoalClick?.(goal)}
                            >
                                {/* Timeline Node */}
                                <div className={`absolute left-3.5 top-4 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-background ${status === "completed"
                                        ? "bg-emerald-500"
                                        : status === "overdue"
                                            ? "bg-red-500"
                                            : "bg-gradient-to-br " + statusColors[status]
                                    }`}>
                                    {status === "completed" ? (
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    ) : (
                                        <Flag className="h-3 w-3 text-white" />
                                    )}
                                </div>

                                {/* Goal Card */}
                                <div className={`p-4 rounded-2xl border ${statusBg[status]} transition-all hover:shadow-lg`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Goal Title */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">🎯</span>
                                                <h4 className={`font-bold truncate ${status === "completed" ? "text-emerald-400 line-through" : "text-foreground"
                                                    }`}>
                                                    {goal.title}
                                                </h4>
                                            </div>

                                            {/* Description */}
                                            {goal.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                                    {goal.description}
                                                </p>
                                            )}

                                            {/* Progress Bar */}
                                            {goal.progress > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Milestone className="h-3 w-3 text-muted-foreground" />
                                                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full bg-gradient-to-r ${statusColors[status]}`}
                                                            style={{ width: `${goal.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {goal.progress}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Date & Status */}
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold text-foreground">
                                                {format(new Date(goal.targetDate), "MMM d")}
                                            </p>
                                            <p className={`text-[10px] font-medium ${status === "completed" ? "text-emerald-400" :
                                                    status === "overdue" ? "text-red-400" :
                                                        status === "soon" ? "text-yellow-400" :
                                                            "text-muted-foreground"
                                                }`}>
                                                {status === "completed" ? "Done!" :
                                                    status === "overdue" ? `${Math.abs(daysLeft)}d overdue` :
                                                        daysLeft === 0 ? "Due today" :
                                                            `${daysLeft}d left`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border">
                {[
                    { status: "active", label: "Active" },
                    { status: "soon", label: "Due Soon" },
                    { status: "overdue", label: "Overdue" },
                    { status: "completed", label: "Completed" },
                ].map(({ status, label }) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${statusColors[status as keyof typeof statusColors]}`} />
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
