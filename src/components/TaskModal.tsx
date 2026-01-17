"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Task, TimeBlock as TimeBlockType, useTask } from "@/context/TaskContext";
import { Trash2, Clock, Calendar, Bell, Smile, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task;
  defaultDay?: string; // Pre-select a specific day (e.g., "MON", "TUE", etc.)
  specificDate?: string; // "YYYY-MM-DD" - if set, creates a single-occurrence task
}

const TIME_BLOCKS: TimeBlockType[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const REMINDERS = [
  { label: "None", value: "" },
  { label: "5m before", value: "5m" },
  { label: "10m before", value: "10m" },
  { label: "15m before", value: "15m" },
  { label: "30m before", value: "30m" },
  { label: "1h before", value: "1h" },
];

// Emoji icons for quick selection
const TASK_ICONS = [
  "📝", "💼", "💻", "📚", "🏃", "🧘", "💪", "🍽️", "☕", "🛏️",
  "🎯", "📞", "✉️", "🧹", "🚿", "💊", "🌅", "🌙", "⭐", "❤️",
  "🎨", "🎵", "🎮", "📖", "✍️", "🧠", "💡", "🔥", "🌿", "🙏"
];

// Auto-detect time block based on hour
function getTimeBlockFromTime(time: string): TimeBlockType {
  if (!time) return "Morning";
  const [hours] = time.split(":").map(Number);
  if (hours >= 4 && hours < 6) return "Dawn";
  if (hours >= 6 && hours < 12) return "Morning";
  if (hours >= 12 && hours < 14) return "Noon";
  if (hours >= 14 && hours < 17) return "Afternoon";
  if (hours >= 17 && hours < 20) return "Evening";
  return "Night";
}

// Get current day abbreviation
function getCurrentDayAbbr(): string {
  return format(new Date(), "EEE").toUpperCase();
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit, defaultDay, specificDate }) => {
  const { addTask, updateTask, deleteTask } = useTask();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📝");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeBlock, setTimeBlock] = useState<TimeBlockType>("Morning");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [reminder, setReminder] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const resetForm = () => {
    setTitle("");
    setIcon("📝");
    // Set default start time to current time rounded to nearest 5 minutes
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(minutes);
    const defaultStartTime = format(now, "HH:mm");
    setStartTime(defaultStartTime);
    setEndTime(""); // Optional - leave empty by default
    setTimeBlock(getTimeBlockFromTime(defaultStartTime));
    setSelectedDays([getCurrentDayAbbr()]); // Default to current day only
    setReminder("");
    setShowIconPicker(false);
  };

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setIcon(taskToEdit.icon);
      setStartTime(taskToEdit.startTime);
      setEndTime(taskToEdit.endTime);
      setTimeBlock(taskToEdit.timeBlock);
      setSelectedDays(taskToEdit.days);
      setReminder(taskToEdit.reminder || "");
    } else {
      // Reset form and use defaultDay if provided
      setTitle("");
      setIcon("📝");
      const now = new Date();
      const minutes = Math.ceil(now.getMinutes() / 5) * 5;
      now.setMinutes(minutes);
      const defaultStartTime = format(now, "HH:mm");
      setStartTime(defaultStartTime);
      setEndTime("");
      setTimeBlock(getTimeBlockFromTime(defaultStartTime));
      setSelectedDays(defaultDay ? [defaultDay] : [getCurrentDayAbbr()]);
      setReminder("");
      setShowIconPicker(false);
    }
  }, [taskToEdit, isOpen, defaultDay]);

  // Auto-detect time block when start time changes
  useEffect(() => {
    if (startTime && !taskToEdit) {
      setTimeBlock(getTimeBlockFromTime(startTime));
    }
  }, [startTime, taskToEdit]);

  const handleSave = () => {
    if (!title || !startTime) return;

    // If end time not provided, default to 1 hour after start
    let finalEndTime = endTime;
    if (!endTime && startTime) {
      const [hours, mins] = startTime.split(":").map(Number);
      const endHour = (hours + 1) % 24;
      finalEndTime = `${endHour.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }

    const data = {
      title,
      icon,
      startTime,
      endTime: finalEndTime,
      timeBlock,
      days: selectedDays.length > 0 ? selectedDays : [getCurrentDayAbbr()],
      reminder: reminder || undefined,
      specificDate: specificDate || undefined // Save specific date if provided
    };

    if (taskToEdit) {
      updateTask({ ...taskToEdit, ...data });
    } else {
      addTask(data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (taskToEdit) {
      deleteTask(taskToEdit.id);
      onClose();
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectIcon = (selectedIcon: string) => {
    setIcon(selectedIcon);
    setShowIconPicker(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Add Task"}
      className="max-w-2xl"
    >
      <div className="space-y-8 py-2">
        {/* Title & Icon Section */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-32 space-y-2.5 shrink-0">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Icon</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="neu-convex hover:scale-105 active:scale-95 flex h-20 w-full items-center justify-center gap-2 rounded-[1.5rem] bg-white/5 text-4xl transition-all shadow-lg shadow-black/20"
              >
                {icon}
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                    <Smile className="w-4 h-4" />
                </div>
              </button>

              {/* Icon Picker Dropdown */}
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-4 p-5 rounded-[2rem] glass-premium z-50 shadow-2xl w-[300px] border-white/20 animate-in fade-in zoom-in-95">
                  <div className="grid grid-cols-5 gap-3">
                    {TASK_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => selectIcon(emoji)}
                        className={cn(
                          "h-12 w-12 rounded-xl text-2xl flex items-center justify-center transition-all hover:scale-110",
                          icon === emoji
                            ? "neu-concave bg-purple-500/20 ring-1 ring-purple-500/50"
                            : "neu-flat hover:neu-convex"
                        )}
                        style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Task Name</label>
            <Input
              placeholder="What do you need to get done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="neu-concave h-20 text-xl font-bold rounded-[1.5rem] px-6 bg-transparent placeholder:text-muted-foreground/40 focus:ring-purple-500/30"
            />
          </div>
        </div>

        {/* Time Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timing Card */}
          <div className="neu-convex p-6 rounded-[2rem] space-y-5 bg-white/[0.02]">
            <div className="flex items-center gap-3 text-purple-400">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                 <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Timing</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Start</label>
                 <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="neu-concave bg-transparent h-12 rounded-xl text-center font-bold"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">End <span className="text-muted-foreground/40">(opt)</span></label>
                 <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="neu-concave bg-transparent h-12 rounded-xl text-center font-bold"
                 />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block pl-1">
                Time Block <span className="text-purple-400/60 font-medium normal-case ml-1">(auto)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_BLOCKS.map(block => (
                  <button
                    key={block}
                    type="button"
                    onClick={() => setTimeBlock(block)}
                    className={cn(
                      "py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                      timeBlock === block
                        ? "bg-purple-500/20 text-purple-400 shadow-inner"
                        : "neu-flat hover:neu-convex text-muted-foreground"
                    )}
                  >
                    {block}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reminders Card */}
          <div className="neu-convex p-6 rounded-[2rem] space-y-5 bg-white/[0.02]">
            <div className="flex items-center gap-3 text-pink-400">
              <div className="h-8 w-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                 <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Reminders</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {REMINDERS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReminder(r.value)}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-bold transition-all",
                    reminder === r.value
                      ? "neu-concave text-pink-500"
                      : "neu-flat hover:neu-convex text-muted-foreground hover:text-pink-400"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Days Selection - HIDDEN if specificDate is set */}
        {!specificDate && (
          <div className="neu-convex p-6 rounded-[2rem] bg-white/[0.02] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-purple-400">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                   <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Repeat On</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Today: <span className="text-purple-400">{getCurrentDayAbbr()}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "flex-1 h-12 rounded-xl text-xs font-bold transition-all border-0 min-w-[50px]",
                    selectedDays.includes(day)
                      ? "neu-convex bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 scale-105"
                      : "neu-flat text-muted-foreground hover:text-foreground hover:scale-105"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Specific Date Indicator */}
        {specificDate && (
          <div className="neu-concave flex items-center gap-4 p-5 rounded-[1.5rem] bg-purple-500/5 text-purple-200">
            <Calendar className="w-6 h-6 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">One-time Task</span>
              <span className="font-bold text-lg">{format(new Date(specificDate), "MMMM d, yyyy")}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          {taskToEdit && (
            <Button
              variant="ghost"
              type="button"
              onClick={handleDelete}
              className="h-14 rounded-2xl neu-flat hover:neu-concave hover:bg-red-500/10 text-red-500 px-6 font-bold gap-2"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sm:hidden">Delete</span>
            </Button>
          )}
          {taskToEdit && (
             <Button
               variant="ghost"
               type="button"
               onClick={() => {
                 const copiedData = {
                   title: title + " (Copy)",
                   icon,
                   startTime,
                   endTime,
                   timeBlock,
                   days: selectedDays,
                   reminder: reminder || undefined
                 };
                 addTask(copiedData);
                 onClose();
               }}
               className="h-14 rounded-2xl neu-flat hover:neu-concave hover:bg-purple-500/10 text-purple-500 px-6 font-bold gap-2"
             >
               <Copy className="h-5 w-5" />
               <span className="sm:hidden">Copy</span>
             </Button>
          )}

          <div className="flex-1" />

          <Button
            variant="ghost"
            onClick={onClose}
            className="h-14 rounded-2xl neu-flat hover:neu-convex text-muted-foreground hover:text-foreground font-bold px-8"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title || !startTime}
            className="h-14 rounded-2xl neu-convex bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-10 shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
          >
            {taskToEdit ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { TaskModal };
