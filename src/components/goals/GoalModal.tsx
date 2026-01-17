"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, cn } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Target, Plus, X, Calendar } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Goal, Milestone } from "./GoalCard";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, "id" | "createdAt" | "isCompleted"> | Goal) => void;
    goalToEdit?: Goal;
}

export const GoalModal: React.FC<GoalModalProps> = ({
    isOpen,
    onClose,
    onSave,
    goalToEdit,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("🎯");
    const [targetDate, setTargetDate] = useState("");
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [newMilestone, setNewMilestone] = useState("");

    useEffect(() => {
        if (goalToEdit) {
            setTitle(goalToEdit.title || "");
            setDescription(goalToEdit.description || "");
            setIcon(goalToEdit.icon || "🎯");
            setTargetDate(goalToEdit.targetDate ? goalToEdit.targetDate.split("T")[0] : "");
            setMilestones(goalToEdit.milestones || []);
        } else {
            resetForm();
        }
    }, [goalToEdit, isOpen]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setIcon("🎯");
        setTargetDate("");
        setMilestones([]);
        setNewMilestone("");
    };

    const handleAddMilestone = () => {
        if (newMilestone.trim()) {
            setMilestones([
                ...milestones,
                { id: uuidv4(), title: newMilestone.trim(), isCompleted: false },
            ]);
            setNewMilestone("");
        }
    };

    const handleRemoveMilestone = (id: string) => {
        setMilestones(milestones.filter((m) => m.id !== id));
    };

    const handleSave = () => {
        if (!title.trim() || !targetDate) return;

        const goalData = {
            title: title.trim(),
            description: description.trim(),
            icon,
            targetDate: new Date(targetDate).toISOString(),
            milestones,
            linkedTaskIds: goalToEdit?.linkedTaskIds || [],
        };

        if (goalToEdit) {
            onSave({ ...goalToEdit, ...goalData });
        } else {
            onSave(goalData);
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={goalToEdit ? "Edit Goal" : "Create New Goal"}
            className="max-w-2xl"
        >
            <div className="space-y-6 py-2">
                {/* Title & Icon */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-24 shrink-0">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                            Icon
                        </label>
                        <input
                            type="text"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            maxLength={2}
                            className="flex h-14 w-full rounded-2xl border border-white/10 bg-white/5 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            label="Goal Title"
                            placeholder="What do you want to achieve?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-14 bg-white/5 text-lg font-medium border-white/10"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Description (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Why is this goal important to you?"
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                    />
                </div>

                {/* Target Date */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Target Date
                        </span>
                    </div>
                    <Input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="bg-black/20 border-white/5"
                    />
                </div>

                {/* Milestones */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-2 mb-3 text-purple-400">
                        <Target className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Milestones
                        </span>
                    </div>

                    {/* Add Milestone */}
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Add a milestone..."
                            value={newMilestone}
                            onChange={(e) => setNewMilestone(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                            className="bg-black/20 border-white/5"
                        />
                        <Button
                            onClick={handleAddMilestone}
                            disabled={!newMilestone.trim()}
                            className="h-12 w-12 rounded-xl bg-purple-500 hover:bg-purple-600 text-white border-0 shrink-0"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Milestone List */}
                    {milestones.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {milestones.map((milestone, index) => (
                                <div
                                    key={milestone.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-muted-foreground w-6">
                                            {index + 1}.
                                        </span>
                                        <span className="text-sm font-medium text-white">
                                            {milestone.title}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveMilestone(milestone.id)}
                                        className="h-8 w-8 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground/50 text-center py-4 italic">
                            No milestones added yet
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                    <div className="flex-1" />
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold px-8 border-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!title.trim() || !targetDate}
                        className="h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-12 border-0 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {goalToEdit ? "Save Changes" : "Create Goal"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
