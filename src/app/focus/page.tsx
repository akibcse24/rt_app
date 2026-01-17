"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { TimerDisplay } from "@/components/focus/TimerDisplay";
import { SessionControls } from "@/components/focus/SessionControls";
import { AmbientPlayer } from "@/components/focus/AmbientPlayer";
import { FocusStats } from "@/components/focus/FocusStats";
import { QuickNotes } from "@/components/focus/QuickNotes";
import { SessionReport } from "@/components/focus/SessionReport";
import { FocusEnergyMeter } from "@/components/focus/FocusEnergyMeter";
import { PresetSelector } from "@/components/focus/PresetSelector";
import { ResumeSessionDialog } from "@/components/focus/ResumeSessionDialog";
import { ZenModeToggle } from "@/components/focus/ZenModeToggle";
import { TimeAdjustmentControls } from "@/components/focus/TimeAdjustmentControls";
import { ModeToggle } from "@/components/focus/ModeToggle";
import { ThemeSelector } from "@/components/focus/ThemeSelector";
import { IntentionModal } from "@/components/focus/IntentionModal";
import { DistractionLogger } from "@/components/focus/DistractionLogger";
import { AchievementToast } from "@/components/focus/AchievementToast";
import { FocusStreakCalendar } from "@/components/focus/FocusStreakCalendar";
import { PhysicalBreakGuidance } from "@/components/focus/PhysicalBreakGuidance";
import { ZenBackground } from "@/components/focus/ZenBackground";
import { Timer, Zap, Coffee, Target, Eye, Maximize2, Settings, ChevronDown } from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { getEnergyPatterns } from "@/lib/focusSessionUtils";
import { cn } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export default function FocusPage() {
  const {
    minutes,
    seconds,
    isActive,
    isPaused,
    toggleTimer,
    resetTimer,
    sessionType,
    setSession,
    totalSeconds,
    todayStats,
    currentPreset,
    changePreset,
    linkTask,
    unlinkTask,
    linkedTaskId,
    linkedTaskTitle,
    sessionNotes,
    setSessionNotes,
    showSessionReport,
    setShowSessionReport,
    lastSessionData,
    showResumeDialog,
    setShowResumeDialog,
    incompleteSession,
    resumeSession,
    discardIncompleteSession,
    // New features
    timerMode,
    isOvertime,
    overtimeSeconds,
    toggleMode,
    zenMode,
    setZenMode,
    timerTheme,
    changeTheme,
    adjustTime,
    sessionIntention,
    setIntention,
    distractionReasons,
    logDistraction,
    achievements,
    newAchievement,
    setNewAchievement,
  } = useFocusTimer();

  const { tasks } = useTask();
  const { user } = useAuth();

  const [energyPatterns, setEnergyPatterns] = useState<any[]>([]);
  const [loadingEnergy, setLoadingEnergy] = useState(true);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showDistractionLogger, setShowDistractionLogger] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load energy patterns
  useEffect(() => {
    if (!user) return;

    const loadEnergyPatterns = async () => {
      try {
        const patterns = await getEnergyPatterns(user.uid, 30);
        setEnergyPatterns(patterns);
      } catch (error) {
        console.error("Failed to load energy patterns:", error);
      } finally {
        setLoadingEnergy(false);
      }
    };

    loadEnergyPatterns();
  }, [user]);

  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => !t.isCompleted);
  }, [tasks]);

  const handleTaskSelection = (taskId: string) => {
    if (!taskId || taskId === "freestyle") {
      unlinkTask();
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      linkTask(task.id, task.title);
    }
  };

  const handleReviewNotes = () => {
    setShowSessionReport(false);
  };

  const handleStartSession = () => {
    if (!sessionIntention) {
      setShowIntentionModal(true);
    } else {
      toggleTimer();
    }
  };

  const handleIntentionSave = (intention: string) => {
    setIntention(intention);
    toggleTimer();
  };

  const currentHour = new Date().getHours();

  // Calculate weekly data for streak calendar
  const weeklyData = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return dayNames.map((day) => ({ day, minutes: 0 }));
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen bg-background pb-20 relative overflow-hidden transition-colors duration-300",
        zenMode && "fixed inset-0 z-50"
      )}
    >
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/5 blur-[120px] rounded-full pointer-events-none" />



      {/* Header - Hidden in Zen Mode */}
      <AnimatePresence>
        {!zenMode && <Header />}
      </AnimatePresence>

      {/* Persistent Zen Mode Toggle (Visible in Zen Mode) */}
      <AnimatePresence>
        {zenMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-6 right-6 z-[60]"
          >
            <ZenModeToggle
              isActive={zenMode}
              onToggle={() => setZenMode(!zenMode)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn(
        "container mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-12 relative z-10 transition-all duration-500",
        zenMode && "pt-0 max-w-4xl z-50 fixed inset-0 flex flex-col items-center justify-center"
      )}>
        {/* Standard Mode Layout */}
        {!zenMode && (
          <div className="space-y-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-2">
                <Timer className="w-8 h-8" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                Focus Engine
              </h2>
              <p className="text-muted-foreground font-medium max-w-md">
                {timerMode === "stopwatch"
                  ? "Unlimited focus time. Stop whenever you're done."
                  : "Enter deep work. Select a task and synchronize your mind."
                }
              </p>

              {/* Session Intention */}
              {sessionIntention && (
                <div className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium">
                  🎯 {sessionIntention}
                </div>
              )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column: Timer & Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Task Selector */}
                <div className="w-full relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Target className="h-4 w-4 text-purple-400" />
                  </div>
                  <select
                    value={linkedTaskId || ""}
                    onChange={(e) => handleTaskSelection(e.target.value)}
                    disabled={isActive}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled className="bg-zinc-900 text-white">
                      {sessionIntention ? "Task linked to intention" : "Select a Task to Focus On..."}
                    </option>
                    {todaysTasks.map((t) => (
                      <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                        {t.icon} {t.title}
                      </option>
                    ))}
                    <option value="freestyle" className="bg-zinc-900 text-white">
                      🎯 Freestyle Focus
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Preset Selector & Settings */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <PresetSelector
                      currentPreset={currentPreset}
                      onSelectPreset={changePreset}
                      disabled={isActive}
                    />
                  </div>

                  {/* Quick Settings Toggle */}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      "h-12 w-12 rounded-xl border transition-all flex items-center justify-center",
                      showSettings
                        ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>

                {/* Settings Panel */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 rounded-3xl bg-card border border-border space-y-6">
                        <ModeToggle
                          mode={timerMode}
                          onToggle={toggleMode}
                          disabled={isActive}
                        />
                        <ThemeSelector
                          currentTheme={timerTheme}
                          onSelect={changeTheme}
                          disabled={isActive}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timer Card */}
                <div className="relative group">
                  {isActive && !isPaused && !isOvertime && (
                    <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse blur-2xl -z-10" />
                  )}

                  <div className="rounded-[3rem] bg-card border border-border shadow-xl p-8 md:p-12">
                    <div className="flex flex-col items-center space-y-8">
                      <TimerDisplay
                        minutes={minutes}
                        seconds={seconds}
                        isActive={isActive && !isPaused}
                        totalSeconds={totalSeconds}
                        isOvertime={isOvertime}
                        overtimeSeconds={overtimeSeconds}
                        mode={timerMode}
                        theme={timerTheme}
                      />

                      {isActive && !isOvertime && (
                        <TimeAdjustmentControls
                          onAdjust={adjustTime}
                          disabled={isPaused}
                        />
                      )}

                      <div className="w-full max-w-sm space-y-8">
                        <SessionControls
                          isActive={isActive}
                          isPaused={isPaused}
                          isOvertime={isOvertime}
                          sessionType={sessionType}
                          onToggle={sessionIntention ? toggleTimer : handleStartSession}
                          onReset={resetTimer}
                          onSetSession={setSession}
                          onAdjustTime={adjustTime}
                          onLogDistraction={() => setShowDistractionLogger(true)}
                        />

                        <div className="pt-8 border-t border-border/50 w-full flex justify-center">
                          <AmbientPlayer isZen={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <FocusFeature
                    icon={Zap}
                    title="Deep Focus"
                    desc="Increases cognitive load handling by 40%."
                  />
                  <FocusFeature
                    icon={Coffee}
                    title="Smart Breaks"
                    desc="Optimized intervals for maximum neuro-recovery."
                  />
                  <FocusFeature
                    icon={Target}
                    title="Anti-Distraction"
                    desc="Tracks focus quality with real-time metrics."
                  />
                </div>
              </div>

              {/* Right Column: Stats & Insights */}
              <div className="space-y-6">
                <ZenModeToggle
                  isActive={zenMode}
                  onToggle={() => setZenMode(!zenMode)}
                />

                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-center flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Today's Focus
                    </p>
                    <p className="text-lg font-black text-foreground">
                      {todayStats.minutes} <span className="text-xs font-medium text-muted-foreground">mins</span>
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Sessions
                    </p>
                    <p className="text-lg font-black text-foreground">{todayStats.sessions}</p>
                  </div>
                </div>

                <FocusStats todayMinutes={todayStats.minutes} todaySessions={todayStats.sessions} />

                <FocusStreakCalendar
                  weeklyData={weeklyData}
                  currentStreak={0}
                  longestStreak={0}
                  totalFocusDays={todayStats.sessions}
                />

                {!loadingEnergy && energyPatterns.length > 0 && (
                  <FocusEnergyMeter patterns={energyPatterns} currentHour={currentHour} />
                )}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {zenMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-8 overflow-hidden"
            >
              {/* Dynamic Zen Background */}
              <ZenBackground />

              {/* Immersive Layout */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-screen-md space-y-16">

                {/* Floating Timer Container */}
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-purple-500/10 blur-[100px] rounded-full scale-150 animate-pulse" />
                  <div className="scale-125 md:scale-150 transform transition-transform duration-1000">
                    <TimerDisplay
                      minutes={minutes}
                      seconds={seconds}
                      isActive={isActive && !isPaused}
                      totalSeconds={totalSeconds}
                      isOvertime={isOvertime}
                      overtimeSeconds={overtimeSeconds}
                      mode={timerMode}
                      theme="mono"
                    />
                  </div>
                </motion.div>

                {/* Intelligent Controls - Fade in on hover or interaction */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="flex flex-col items-center space-y-12 w-full max-w-sm"
                >
                  <SessionControls
                    isActive={isActive}
                    isPaused={isPaused}
                    isOvertime={isOvertime}
                    isZen={true}
                    sessionType={sessionType}
                    onToggle={sessionIntention ? toggleTimer : handleStartSession}
                    onReset={resetTimer}
                    onSetSession={setSession}
                    onAdjustTime={adjustTime}
                    onLogDistraction={() => { }}
                  />
                  <div className="w-full h-px bg-white/5" />
                  <AmbientPlayer isZen={true} />
                </motion.div>
              </div>

              {/* Zen Mode Exit Hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                className="absolute bottom-10 text-[10px] font-bold text-white uppercase tracking-[0.5em] pointer-events-none"
              >
                Zen Mode Protocol Active
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Notes Floating Button */}
      <QuickNotes
        isVisible={isActive && !zenMode}
        onSave={setSessionNotes}
        existingNotes={sessionNotes}
      />

      {/* Physical Break Guidance */}
      <PhysicalBreakGuidance
        sessionType={sessionType}
        isActive={isActive}
      />

      {/* Session Report Modal */}
      {lastSessionData && (
        <SessionReport
          isOpen={showSessionReport}
          onClose={() => setShowSessionReport(false)}
          sessionData={lastSessionData}
          onReview={handleReviewNotes}
        />
      )}

      {/* Resume Session Dialog */}
      {incompleteSession && (
        <ResumeSessionDialog
          isOpen={showResumeDialog}
          onResume={resumeSession}
          onDiscard={discardIncompleteSession}
          sessionData={{
            duration: incompleteSession.duration,
            sessionType: incompleteSession.sessionType,
            taskTitle: incompleteSession.linkedTaskTitle || undefined,
            remainingMinutes: Math.floor(
              (incompleteSession.duration * 60 -
                (Date.now() - incompleteSession.startTime.toMillis()) / 1000) /
              60
            ),
            remainingSeconds: Math.floor(
              ((incompleteSession.duration * 60 -
                (Date.now() - incompleteSession.startTime.toMillis()) / 1000) %
                60)
            ),
          }}
        />
      )}

      {/* Intention Modal */}
      <IntentionModal
        isOpen={showIntentionModal}
        onClose={() => setShowIntentionModal(false)}
        onSave={handleIntentionSave}
      />

      {/* Distraction Logger */}
      <DistractionLogger
        isOpen={showDistractionLogger}
        onClose={() => setShowDistractionLogger(false)}
        onLog={logDistraction}
      />

      {/* Achievement Toast */}
      <AchievementToast
        achievement={newAchievement}
        onClose={() => setNewAchievement(null)}
      />

      {/* Footer - Hidden in Zen Mode */}
      <AnimatePresence>
        {!zenMode && (
          <footer className="absolute bottom-8 left-0 w-full text-center px-6 pointer-events-none">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.5em]">
              Synchronize your mind • Deep work protocol
            </p>
          </footer>
        )}
      </AnimatePresence>
    </div>
  );
}

function FocusFeature({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-6 rounded-3xl bg-card border border-border space-y-2 group hover:bg-muted/50 transition-all text-center md:text-left shadow-sm hover:shadow-md">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-purple-500 mb-2 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-foreground tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
