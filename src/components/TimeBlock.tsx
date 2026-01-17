"use client";

import React from "react";
import { TimeBlock as TimeBlockType, useTask } from "@/context/TaskContext";
import { TaskCard } from "./TaskCard";
import { Task } from "@/context/TaskContext";
import { Sunrise, Sun, SunMedium, Sunset, Moon, CloudSun, Clock } from "lucide-react";

interface TimeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  block: TimeBlockType;
  timeRange: string;
  onEditTask: (task: Task) => void;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ block, timeRange, onEditTask, ...props }) => {
  const { getTasksByTimeBlock } = useTask();
  const tasks = getTasksByTimeBlock(block);

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getBlockIcon = () => {
    switch (block) {
      case "Dawn": return <Sunrise className="w-6 h-6" />;
      case "Morning": return <CloudSun className="w-6 h-6" />;
      case "Noon": return <Sun className="w-6 h-6" />;
      case "Afternoon": return <SunMedium className="w-6 h-6" />;
      case "Evening": return <Sunset className="w-6 h-6" />;
      case "Night": return <Moon className="w-6 h-6" />;
      default: return null;
    }
  };

  const colors = {
    Dawn: "from-orange-500/10 to-pink-500/5 text-orange-500 border-orange-500/20",
    Morning: "from-yellow-500/10 to-orange-500/5 text-yellow-500 border-yellow-500/20",
    Noon: "from-blue-500/10 to-cyan-500/5 text-blue-500 border-blue-500/20",
    Afternoon: "from-sky-500/10 to-indigo-500/5 text-sky-500 border-sky-500/20",
    Evening: "from-purple-500/10 to-pink-500/5 text-purple-500 border-purple-500/20",
    Night: "from-indigo-500/10 to-blue-900/5 text-indigo-500 border-indigo-500/20",
  };

  return (
    <div className={`group flex flex-col h-full rounded-[2.5rem] glass-panel border ${colors[block]} p-8 transition-all duration-500 hover:shadow-2xl shadow-lg hover:-translate-y-2 overflow-hidden relative`} {...props}>
      {/* Background Progress Glow */}
      <div
        className="absolute bottom-0 left-0 h-1.5 bg-muted/30 w-full transition-all duration-1000 blur-[1px]"
        style={{ background: `linear-gradient(to right, currentColor ${progress}%, transparent ${progress}%)` }}
      />

      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border shadow-sm transition-transform group-hover:scale-105`}>
            {getBlockIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{block}</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full w-fit">
              <Clock className="w-3 h-3 opacity-60" />
              {timeRange}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-bold text-foreground">{completedCount}<span className="text-sm text-muted-foreground/60 font-bold">/{tasks.length}</span></span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Rituals</span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEditTask} />)
        ) : (
          <div className="h-full min-h-[140px] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border bg-muted/30 p-6 text-center group-hover:border-primary/30 transition-colors">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Sunrise className="w-5 h-5 opacity-30" />
            </div>
            <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">No activities scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { TimeBlock };

