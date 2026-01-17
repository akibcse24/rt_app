"use client";

import React, { useState, useEffect } from "react";
import { Coffee, Eye, StretchVertical, Droplets, Sun, Brain, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PhysicalBreakGuidanceProps {
  sessionType: "focus" | "shortBreak" | "longBreak";
  isActive: boolean;
  onActivityComplete?: (activity: string) => void;
}

interface BreakActivity {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // seconds
  category: string;
}

const SHORT_BREAK_ACTIVITIES: BreakActivity[] = [
  {
    id: "eye_rest",
    title: "20-20-20 Rule",
    description: "Look at something 20 feet away for 20 seconds",
    icon: <Eye className="w-5 h-5" />,
    duration: 20,
    category: "eyes"
  },
  {
    id: "stretch_neck",
    title: "Neck Stretch",
    description: "Gently stretch your neck side to side",
    icon: <StretchVertical className="w-5 h-5" />,
    duration: 30,
    category: "movement"
  },
  {
    id: "drink_water",
    title: "Hydrate",
    description: "Take a sip of water",
    icon: <Droplets className="w-5 h-5" />,
    duration: 10,
    category: "health"
  },
  {
    id: "deep_breath",
    title: "Deep Breathing",
    description: "3 deep breaths to reset your mind",
    icon: <Brain className="w-5 h-5" />,
    duration: 30,
    category: "mind"
  },
];

const LONG_BREAK_ACTIVITIES: BreakActivity[] = [
  {
    id: "walk_around",
    title: "Take a Walk",
    description: "Get up and walk around for a few minutes",
    icon: <StretchVertical className="w-5 h-5" />,
    duration: 120,
    category: "movement"
  },
  {
    id: "shoulder_stretch",
    title: "Full Body Stretch",
    description: "Stretch your arms, back, and legs",
    icon: <StretchVertical className="w-5 h-5" />,
    duration: 60,
    category: "movement"
  },
  {
    id: "sunlight",
    title: "Get Some Sun",
    description: "Look out a window or go outside briefly",
    icon: <Sun className="w-5 h-5" />,
    duration: 60,
    category: "health"
  },
  {
    id: "meditation",
    title: "Mini Meditation",
    description: "1 minute of mindful breathing",
    icon: <Brain className="w-5 h-5" />,
    duration: 60,
    category: "mind"
  },
];

export const PhysicalBreakGuidance: React.FC<PhysicalBreakGuidanceProps> = ({
  sessionType,
  isActive,
  onActivityComplete,
}) => {
  const [currentActivity, setCurrentActivity] = useState<BreakActivity | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activities = sessionType === "longBreak" ? LONG_BREAK_ACTIVITIES : SHORT_BREAK_ACTIVITIES;

  useEffect(() => {
    if (!isActive || sessionType === "focus") {
      setCurrentActivity(null);
      setShowSuggestions(false);
      return;
    }

    // Show suggestion after 10 seconds of break
    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [isActive, sessionType]);

  useEffect(() => {
    if (!currentActivity) return;

    setTimeRemaining(currentActivity.duration);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onActivityComplete?.(currentActivity.title);
          setCurrentActivity(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentActivity, onActivityComplete]);

  if (sessionType !== "focus" && isActive && currentActivity) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
      >
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 p-8 text-center shadow-2xl">
          {/* Activity Icon */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white mx-auto mb-4"
          >
            {currentActivity.icon}
          </motion.div>

          <h3 className="text-2xl font-black text-foreground mb-2">
            {currentActivity.title}
          </h3>
          <p className="text-muted-foreground font-medium mb-6">
            {currentActivity.description}
          </p>

          {/* Timer */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/10"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="url(#break-gradient)"
                strokeWidth="4"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * (timeRemaining / currentActivity.duration))}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="break-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-foreground">
                {timeRemaining}s
              </span>
            </div>
          </div>

          <button
            onClick={() => setCurrentActivity(null)}
            className="px-6 py-2 rounded-xl bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20 transition-colors text-sm font-medium"
          >
            Skip Activity
          </button>
        </div>
      </motion.div>
    );
  }

  if (!isActive || sessionType === "focus" || !showSuggestions) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg mx-4"
      >
        <div className="rounded-3xl bg-card border border-border p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  Make the most of your break
                </h3>
                <p className="text-xs text-muted-foreground">
                  {sessionType === "longBreak" ? "Long break - try one of these activities!" : "Quick activity to recharge"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Activity Grid */}
          <div className="grid grid-cols-2 gap-2">
            {activities.map((activity) => (
              <motion.button
                key={activity.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentActivity(activity);
                  setShowSuggestions(false);
                }}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400">
                    {activity.icon}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {activity.title}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pl-10">
                  {activity.duration}s
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
