"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LandingPageEnhanced as LandingPage } from "@/components/LandingPageEnhanced";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { DayNavigation } from "@/components/DayNavigation";
import { TimeBlock } from "@/components/TimeBlock";
import { TaskModal } from "@/components/TaskModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { TimeBlock as TimeBlockType, Task, useTask } from "@/context/TaskContext";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { a11y } from "@/components/Accessibility";
import { GlassCard } from "@/components/ui/EnhancedComponents";
import { useSync } from "@/context/SyncContext";

const TIME_BLOCKS: TimeBlockType[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { loading: isTasksLoading, totalTasksToday, isOnline } = useTask();
  const { pendingCount } = useSync();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const reducedMotion = a11y.useReducedMotion();

  // Loading state with accessibility announcements
  if (isAuthLoading || isTasksLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-black"
        role="status"
        aria-label="Loading your routines"
      >
        <div className="relative">
          <div className={`h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent ${reducedMotion ? 'animate-none' : ''}`}></div>
          <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-purple-500/20 blur-md"></div>
        </div>
        <div className="mt-6 text-center space-y-1">
          <p className="text-base font-semibold text-foreground">Summoning your routine...</p>
          <p className="text-xs text-muted-foreground">Preparing your path to excellence...</p>
        </div>
        <a11y.LiveRegion message="Summoning your routine, please wait" type="polite" clearAfter={0} />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleAddTask = () => {
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <>
      {/* Live region for dynamic announcements */}
      <a11y.LiveRegion message="" clearAfter={0} />

      <div className="min-h-screen bg-transparent text-foreground selection:bg-purple-500/30">
        <Header />

        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 md:px-8 pt-10" tabIndex={-1}>
          <div className="flex flex-col gap-2">
            <ProgressBar onAddTask={handleAddTask} />

            <DayNavigation />

            {/* Empty State Banner - Only show when online with no tasks */}
            {/* Note: Offline state is now handled by SyncStatusIndicator component */}
            {(!isTasksLoading && totalTasksToday === 0 && isOnline) && (
              <GlassCard
                className="my-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20"
                role="status"
                aria-live="polite"
              >
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">Ready to conquer the day?</h3>
                    <p className="text-muted-foreground max-w-md">Your schedule is clear. Start from scratch or use a proved template to hit the ground running.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleAddTask}
                      className="bg-foreground text-background hover:opacity-90 font-bold rounded-xl h-12 px-6"
                      aria-label="Create your first routine task"
                    >
                      <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Create Routine
                    </Button>
                  </div>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />
              </GlassCard>
            )}

            <div
              className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
              role="list"
              aria-label="Time blocks with routine tasks"
            >
              {TIME_BLOCKS.map((block) => (
                <TimeBlock
                  key={block}
                  block={block}
                  timeRange={getTimeRange(block)}
                  onEditTask={handleEditTask}
                  role="listitem"
                />
              ))}
            </div>

            <OnboardingTour />
          </div>
        </main>

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          taskToEdit={taskToEdit}
        />

        {/* Footer / Info */}
        <footer className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em]">
            Designed for Excellence • Powered by RT
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground/80">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link>
          </div>
        </footer>
      </div>
    </>
  );
}

function getTimeRange(block: TimeBlockType): string {
  switch (block) {
    case "Dawn": return "4:00 AM - 6:00 AM";
    case "Morning": return "6:00 AM - 12:00 PM";
    case "Noon": return "12:00 PM - 2:00 PM";
    case "Afternoon": return "2:00 PM - 5:00 PM";
    case "Evening": return "5:00 PM - 8:00 PM";
    case "Night": return "8:00 PM - 4:00 AM";
    default: return "";
  }
}
