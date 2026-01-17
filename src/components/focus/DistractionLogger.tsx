"use client";

import React, { useState } from "react";
import { AlertCircle, X, MessageSquare, Coffee, Bell, Users, Battery, Brain, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DistractionLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (reason: string) => void;
}

const DISTRACTION_REASONS = [
  { id: "notification", label: "Notification", icon: Bell, color: "from-red-500 to-orange-500" },
  { id: "hunger", label: "Hunger/Thirst", icon: Coffee, color: "from-amber-500 to-yellow-500" },
  { id: "tired", label: "Feeling Tired", icon: Battery, color: "from-yellow-500 to-green-500" },
  { id: "distracted", label: "Lost Focus", icon: Brain, color: "from-purple-500 to-pink-500" },
  { id: "chat", label: "Someone Came In", icon: Users, color: "from-blue-500 to-cyan-500" },
  { id: "thought", label: "Random Thought", icon: MessageSquare, color: "from-indigo-500 to-purple-500" },
];

export const DistractionLogger: React.FC<DistractionLoggerProps> = ({
  isOpen,
  onClose,
  onLog,
}) => {
  const [customReason, setCustomReason] = useState("");

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
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4"
        >
          <div className="rounded-3xl bg-card border border-border p-6 shadow-2xl relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 -z-10" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    What's distracting you?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Understanding distractions improves focus
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

            {/* Reason Options */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DISTRACTION_REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <motion.button
                    key={reason.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onLog(reason.label);
                      onClose();
                    }}
                    className={`
                      p-3 rounded-xl border border-border bg-card hover:bg-muted/50 
                      transition-all flex items-center gap-2 group
                    `}
                  >
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${reason.color} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors">
                      {reason.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Custom Reason */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Other reason:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type your reason..."
                  className="flex-1 h-10 px-3 rounded-lg bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customReason.trim()) {
                      onLog(customReason.trim());
                      setCustomReason("");
                      onClose();
                    }
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (customReason.trim()) {
                      onLog(customReason.trim());
                      setCustomReason("");
                      onClose();
                    }
                  }}
                  disabled={!customReason.trim()}
                  className="h-10 px-4 rounded-lg bg-purple-500 text-white font-bold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Log
                </motion.button>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
              This data helps improve your focus recommendations
            </p>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};
