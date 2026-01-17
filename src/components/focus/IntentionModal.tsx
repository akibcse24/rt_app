"use client";

import React, { useState } from "react";
import { Target, X, Brain, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IntentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (intention: string) => void;
  existingIntention?: string;
}

export const IntentionModal: React.FC<IntentionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingIntention = "",
}) => {
  const [intention, setIntention] = useState(existingIntention);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presets = [
    { id: "deep_work", label: "Deep Work", icon: Brain, color: "from-orange-500 to-red-500" },
    { id: "quick_task", label: "Quick Task", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { id: "creative", label: "Creative", icon: Target, color: "from-purple-500 to-pink-500" },
    { id: "learning", label: "Learning", icon: Brain, color: "from-blue-500 to-cyan-500" },
  ];

  const handleSave = () => {
    const finalIntention = selectedPreset 
      ? `${presets.find(p => p.id === selectedPreset)?.label}: ${intention}`
      : intention;
    onSave(finalIntention);
    setIntention("");
    setSelectedPreset(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg mx-4"
        >
          <div className="rounded-3xl bg-card border border-border p-8 shadow-2xl relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 -z-10" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Set Your Intention
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Define what you want to accomplish
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                Quick Start
              </p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setIntention("");
                      }}
                      className={`
                        p-3 rounded-xl border-2 transition-all flex items-center gap-2
                        ${selectedPreset === preset.id
                          ? `border-purple-500 bg-gradient-to-br ${preset.color}/10`
                          : "border-border bg-card hover:bg-muted/50"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-foreground">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Or divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Custom Intention Input */}
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={selectedPreset ? "Add details to your intention..." : "What do you want to focus on?"}
              className="w-full h-24 p-4 rounded-xl bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all"
              autoFocus
            />

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={!intention.trim() && !selectedPreset}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Start Focus
              </button>
              <button
                onClick={onClose}
                className="px-6 h-12 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                Skip
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
              Setting an intention increases follow-through by 30%
            </p>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};
