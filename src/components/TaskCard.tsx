"use client";

import React from "react";
import { Check, Bell, Clock, ChevronRight } from "lucide-react";
import { Task, useTask } from "@/context/TaskContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { toggleTaskCompletion } = useTask();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  };

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionTemplate`calc(${y} / 20 * -1deg)`; // Inverse y-axis for tilt
  const rotateY = useMotionTemplate`calc(${x} / 20 * 1deg)`;

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    // Center the origin
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onClick={() => onEdit(task)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex cursor-pointer items-center rounded-[2rem] p-5 transition-all duration-500 overflow-hidden",
        task.isCompleted
          ? "neu-concave opacity-60 grayscale" // Sunk into the screen
          : "glass-premium hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] border-white/40" // Floating glass
      )}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
    >
      {/* Dynamic Glow Effect */}
      {!task.isCompleted && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10" />
      )}

      {/* Completion Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className={cn(
          "mr-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 relative z-20",
          task.isCompleted
            ? "neu-concave text-purple-500"
            : "neu-convex group-hover:bg-purple-500 group-hover:text-white text-muted-foreground border border-white/50"
        )}
      >
        <Check className={cn(
          "h-6 w-6 stroke-[3] transition-all duration-300",
          task.isCompleted ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100"
        )} />
      </motion.button>

      {/* Icon Container */}
      <div className={cn(
        "mr-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] text-3xl transition-all duration-500 group-hover:rotate-6",
        task.isCompleted
          ? "neu-concave text-muted-foreground"
          : "bg-white/30 backdrop-blur-md border border-white/50 shadow-inner text-foreground"
      )}>
        <span className="filter drop-shadow-md">{task.icon || "📝"}</span>
      </div>

      {/* Text Content */}
      <div className="flex-1 overflow-hidden pointer-events-none relative z-10">
        <h3 className={cn(
          "truncate text-lg font-bold tracking-tight transition-all duration-300",
          task.isCompleted ? "text-muted-foreground line-through decoration-2 decoration-purple-500/30" : "text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300"
        )}>
          {task.title}
        </h3>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/30 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20">
            <Clock className="w-3 h-3 text-purple-500" />
            {task.startTime}
          </div>
          {task.reminder && (
            <div className="flex items-center gap-1.5 text-[10px] text-pink-500 font-bold uppercase tracking-widest bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20">
              <Bell className="w-3 h-3" />
              <span>{task.reminder}</span>
            </div>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <ChevronRight className="w-6 h-6 text-muted-foreground/30 group-hover:text-purple-500 transition-all duration-300 group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
};

export { TaskCard };
