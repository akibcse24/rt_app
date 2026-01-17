"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Star, Zap, Flame, Crown } from "lucide-react";
import type { FocusAchievement } from "@/lib/focusSessionUtils";

interface AchievementToastProps {
  achievement: FocusAchievement | null;
  onClose: () => void;
}

const getAchievementIcon = (id: string) => {
  if (id.includes("hour") || id.includes("master") || id.includes("legend")) {
    return Trophy;
  }
  if (id.includes("session") || id.includes("century")) {
    return Flame;
  }
  if (id.includes("perfect") || id.includes("zen")) {
    return Star;
  }
  if (id.includes("flow") || id.includes("super")) {
    return Zap;
  }
  return Sparkles;
};

const getAchievementColor = (id: string) => {
  if (id.includes("master") || id.includes("legend") || id.includes("century")) {
    return "from-yellow-400 to-orange-500";
  }
  if (id.includes("perfect") || id.includes("zen")) {
    return "from-purple-500 to-pink-500";
  }
  if (id.includes("flow") || id.includes("super")) {
    return "from-cyan-400 to-blue-500";
  }
  return "from-emerald-400 to-teal-500";
};

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
}) => {
  if (!achievement) return null;

  const Icon = getAchievementIcon(achievement.id);
  const gradient = getAchievementColor(achievement.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
      >
        <motion.div
          initial={{ rotate: -5 }}
          animate={{ rotate: 0 }}
          className={`
            relative overflow-hidden rounded-2xl p-6 shadow-2xl
            bg-gradient-to-br ${gradient}
          `}
        >
          {/* Confetti effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 200 - 100, 
                  y: Math.random() * 200 - 100,
                  opacity: 1 
                }}
                animate={{ 
                  y: Math.random() * 300 + 100,
                  opacity: 0 
                }}
                transition={{ 
                  duration: 1 + Math.random(), 
                  repeat: Infinity,
                  delay: Math.random() * 0.5
                }}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center"
            >
              <Icon className="h-8 w-8 text-white" />
            </motion.div>
            
            <div>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">
                Achievement Unlocked!
              </p>
              <h3 className="text-xl font-black text-white mb-1">
                {achievement.title}
              </h3>
              <p className="text-sm text-white/90">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <span className="text-white text-xs">✕</span>
          </button>

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: "linear" }}
            className="absolute bottom-0 left-0 h-1 bg-white/50 w-full origin-left"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
