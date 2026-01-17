// ============================================================================
// USE FOCUS TIMER HOOK (Enhanced v2.0 with Flow State, Stopwatch, Zen Mode)
// ============================================================================
// This custom hook manages the Pomodoro-style timer with advanced features:
// - Flow State Overtime Mode (count up after timer ends)
// - Stopwatch Mode for undefined tasks
// - +/- 5 minute dynamic adjustment
// - Zen Mode for immersive focus
// - Firestore persistence for cross-device sync
// - Multiple presets (Classic, Deep Work, Sprint, Custom)
// - Distraction tracking (window blur/focus events)
// - Session abandonment detection and resume
// - Real-time stats integration
// - Background mode (document.title updates)
// - Quick notes capture
// - Task linkage with auto-completion

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createFocusSession,
  updateFocusSession,
  completeFocusSession,
  getIncompleteSession,
  getTodayFocusStats,
  FocusSession,
  saveFocusAchievement,
  getUserAchievements,
  FocusAchievement,
} from "@/lib/focusSessionUtils";
import type { FocusPresetId, FocusPresetConfig } from "@/components/focus/PresetSelector";
import { PRESET_CONFIGS } from "@/components/focus/PresetSelector";
import { Timestamp } from "firebase/firestore";

// Timer theme types
export type TimerTheme = "default" | "light" | "amber" | "mono";

export const useFocusTimerLogic = () => {
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Timer Mode: 'timer' or 'stopwatch'
  const [timerMode, setTimerMode] = useState<"timer" | "stopwatch">("timer");

  // Timer State
  const [sessionType, setSessionType] = useState<
    "focus" | "shortBreak" | "longBreak"
  >("focus");
  const [currentPreset, setCurrentPreset] = useState<FocusPresetId>("classic");
  const [presetConfig, setPresetConfig] = useState<FocusPresetConfig>(
    PRESET_CONFIGS[0]
  );

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Overtime State (Flow State Mode)
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);

  // Zen Mode
  const [zenMode, setZenMode] = useState(false);

  // Theme
  const [timerTheme, setTimerTheme] = useState<TimerTheme>("default");

  // Session Data
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedTaskTitle, setLinkedTaskTitle] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");

  // Intention & Distraction Logging
  const [sessionIntention, setSessionIntention] = useState("");
  const [distractionReasons, setDistractionReasons] = useState<{ type: string; timestamp: number }[]>([]);

  // Stats State
  const [todayStats, setTodayStats] = useState({ minutes: 0, sessions: 0 });

  // Distraction Tracking
  const [blurStartTime, setBlurStartTime] = useState<number | null>(null);
  const [totalBlurTime, setTotalBlurTime] = useState(0);
  const [blurCount, setBlurCount] = useState(0);
  const [previousAverageFocus, setPreviousAverageFocus] = useState(100);

  // Session Report
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [lastSessionData, setLastSessionData] = useState<any>(null);

  // Resume Session Dialog
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [incompleteSession, setIncompleteSession] = useState<FocusSession | null>(null);

  // Achievements
  const [achievements, setAchievements] = useState<FocusAchievement[]>([]);
  const [newAchievement, setNewAchievement] = useState<FocusAchievement | null>(null);

  // References
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const timerStartTime = useRef<number>(Date.now());
  const targetEndTime = useRef<number>(Date.now());
  const hasLoadedFromStorage = useRef(false);

  // ============================================================================
  // LOCALSTORAGE PERSISTENCE
  // ============================================================================

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;

    try {
      const savedState = localStorage.getItem('focus_timer_state');
      if (savedState) {
        const state = JSON.parse(savedState);

        // Only restore if timer was active and not too old (max 24 hours)
        if (state.isActive && state.targetEndTime) {
          const now = Date.now();
          const timeSinceSaved = now - state.savedAt;

          if (timeSinceSaved < 24 * 60 * 60 * 1000) { // 24 hours
            const remaining = Math.max(0, state.targetEndTime - now);

            if (remaining > 0 || state.isOvertime) {
              // Timer still has time left - restore it
              if (state.isOvertime) {
                // Restore overtime state
                const overtimeElapsed = Math.floor((now - state.targetEndTime) / 1000);
                setIsOvertime(true);
                setOvertimeSeconds(Math.max(0, overtimeElapsed));
              }

              const remainingSeconds = Math.max(0, Math.ceil(remaining / 1000));
              const newMinutes = Math.floor(remainingSeconds / 60);
              const newSeconds = remainingSeconds % 60;

              setMinutes(newMinutes);
              setSeconds(newSeconds);
              setIsActive(true);
              setIsPaused(state.isPaused || false);
              setSessionType(state.sessionType || 'focus');
              setTotalSeconds(state.totalSeconds || remainingSeconds);
              setTimerMode(state.timerMode || 'timer');
              setZenMode(state.zenMode || false);
              setTimerTheme(state.timerTheme || 'default');

              // Restore refs
              targetEndTime.current = state.targetEndTime;
              timerStartTime.current = state.timerStartTime || now;
              sessionStartTime.current = state.sessionStartTime || now;

              // Restore session data
              if (state.currentSessionId) setCurrentSessionId(state.currentSessionId);
              if (state.linkedTaskId) setLinkedTaskId(state.linkedTaskId);
              if (state.linkedTaskTitle) setLinkedTaskTitle(state.linkedTaskTitle);
              if (state.sessionNotes) setSessionNotes(state.sessionNotes);
              if (state.totalBlurTime) setTotalBlurTime(state.totalBlurTime);
              if (state.blurCount) setBlurCount(state.blurCount);
              if (state.sessionIntention) setSessionIntention(state.sessionIntention);
              if (state.distractionReasons) setDistractionReasons(state.distractionReasons);
            } else {
              // Timer expired while page was closed - clear storage
              localStorage.removeItem('focus_timer_state');
            }
          } else {
            // State too old - clear it
            localStorage.removeItem('focus_timer_state');
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore timer state:', error);
      localStorage.removeItem('focus_timer_state');
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return; // Don't save until we've loaded

    if (isActive) {
      const state = {
        isActive,
        isPaused,
        sessionType,
        minutes,
        seconds,
        totalSeconds,
        targetEndTime: targetEndTime.current,
        timerStartTime: timerStartTime.current,
        sessionStartTime: sessionStartTime.current,
        currentSessionId,
        linkedTaskId,
        linkedTaskTitle,
        sessionNotes,
        totalBlurTime,
        blurCount,
        savedAt: Date.now(),
        timerMode,
        zenMode,
        timerTheme,
        isOvertime,
        sessionIntention,
        distractionReasons,
      };

      try {
        localStorage.setItem('focus_timer_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save timer state:', error);
      }
    } else {
      // Timer not active - clear storage
      localStorage.removeItem('focus_timer_state');
    }
  }, [isActive, isPaused, minutes, seconds, sessionType, totalSeconds, currentSessionId, linkedTaskId, linkedTaskTitle, sessionNotes, totalBlurTime, blurCount, timerMode, zenMode, timerTheme, isOvertime, sessionIntention, distractionReasons]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Load today's stats, achievements, and check for incomplete sessions
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        // Load today's stats
        const stats = await getTodayFocusStats(user.uid);
        setTodayStats(stats);

        // Check for incomplete session
        const incomplete = await getIncompleteSession(user.uid);
        if (incomplete) {
          setIncompleteSession(incomplete);
          setShowResumeDialog(true);
        }

        // Load achievements
        const userAchievements = await getUserAchievements(user.uid);
        setAchievements(userAchievements);
      } catch (error) {
        console.error("Failed to load focus data:", error);
      }
    };

    loadInitialData();
  }, [user]);

  // ============================================================================
  // ZEN MODE
  // ============================================================================

  useEffect(() => {
    if (zenMode) {
      // Enter fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
      }
    }
  }, [zenMode]);

  // ============================================================================
  // DISTRACTION TRACKING
  // ============================================================================

  useEffect(() => {
    if (!isActive || isPaused || isOvertime) return;

    const handleBlur = () => {
      setBlurStartTime(Date.now());
      setBlurCount((prev) => prev + 1);
    };

    const handleFocus = () => {
      if (blurStartTime) {
        const blurDuration = (Date.now() - blurStartTime) / 1000; // seconds
        setTotalBlurTime((prev) => prev + blurDuration);
        setBlurStartTime(null);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isActive, isPaused, isOvertime, blurStartTime]);

  // ============================================================================
  // BACKGROUND MODE (Document Title Updates)
  // ============================================================================

  useEffect(() => {
    if (isActive && !isPaused) {
      if (isOvertime) {
        const mins = Math.floor(overtimeSeconds / 60);
        const secs = overtimeSeconds % 60;
        const time = `+${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        document.title = `[${time}] Overtime - RT`;
      } else if (timerMode === "stopwatch") {
        const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        document.title = `[${time}] Stopwatch - RT`;
      } else {
        const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        document.title = `[${time}] Focus Engine - RT`;
      }
    } else {
      document.title = "RT - Routine Tracker";
    }

    return () => {
      document.title = "RT - Routine Tracker";
    };
  }, [isActive, isPaused, minutes, seconds, isOvertime, overtimeSeconds, timerMode]);

  // ============================================================================
  // TIMER LOGIC (TIMESTAMP-BASED FOR ACCURACY IN BACKGROUND)
  // ============================================================================

  useEffect(() => {
    if (isActive && !isPaused) {
      const updateTimer = () => {
        const now = Date.now();

        if (timerMode === "stopwatch") {
          // Stopwatch mode: count up
          const elapsed = now - timerStartTime.current;
          const elapsedSeconds = Math.floor(elapsed / 1000);
          const newMinutes = Math.floor(elapsedSeconds / 60);
          const newSeconds = elapsedSeconds % 60;

          setMinutes(newMinutes);
          setSeconds(newSeconds);
        } else if (isOvertime) {
          // Overtime mode: count up from 00:00
          const overtimeElapsed = now - targetEndTime.current;
          const newOvertimeSeconds = Math.floor(overtimeElapsed / 1000);
          setOvertimeSeconds(newOvertimeSeconds);
        } else {
          // Normal countdown mode
          const elapsed = now - timerStartTime.current;
          const remaining = Math.max(0, targetEndTime.current - now);
          const remainingSeconds = Math.ceil(remaining / 1000);
          const newMinutes = Math.floor(remainingSeconds / 60);
          const newSeconds = remainingSeconds % 60;

          setMinutes(newMinutes);
          setSeconds(newSeconds);

          // Check if timer finished - transition to overtime
          if (remaining <= 0) {
            handleTimerComplete();
          }
        }
      };

      // Update every 100ms for smooth display
      intervalRef.current = setInterval(updateTimer, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, timerMode, isOvertime]);

  // Handle visibility change to sync timer when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive && !isPaused) {
        // Force update when tab becomes visible again
        const now = Date.now();

        if (timerMode === "stopwatch") {
          const elapsed = now - timerStartTime.current;
          const elapsedSeconds = Math.floor(elapsed / 1000);
          setMinutes(Math.floor(elapsedSeconds / 60));
          setSeconds(elapsedSeconds % 60);
        } else if (isOvertime) {
          const overtimeElapsed = now - targetEndTime.current;
          setOvertimeSeconds(Math.max(0, Math.floor(overtimeElapsed / 1000)));
        } else {
          const remaining = Math.max(0, targetEndTime.current - now);
          const remainingSeconds = Math.ceil(remaining / 1000);
          setMinutes(Math.floor(remainingSeconds / 60));
          setSeconds(remainingSeconds % 60);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isPaused, timerMode, isOvertime]);

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  const handleTimerComplete = async () => {
    // Don't end session - transition to overtime (Flow State Mode)
    if (timerMode === "timer" && sessionType === "focus") {
      setIsOvertime(true);
      setIsPaused(false);

      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("RT - Focus Timer", {
          body: "Timer complete! You're in Flow State Mode. Keep going! 🌟",
        });
      }
      return;
    }

    // For breaks or stopwatch mode, complete normally
    await handleSessionComplete();
  };

  const handleSessionComplete = async () => {
    clearInterval(intervalRef.current as NodeJS.Timeout);
    setIsActive(false);

    if (!user) return;

    try {
      // Calculate focus metrics
      const sessionDuration = timerMode === "stopwatch"
        ? (Date.now() - sessionStartTime.current) / 1000
        : (presetConfig.focusMinutes * 60);

      const focusPercentage = timerMode === "stopwatch"
        ? 100 // Stopwatch mode always 100% for now
        : Math.max(
          0,
          Math.min(100, ((sessionDuration - totalBlurTime) / sessionDuration) * 100)
        );

      const isPerfectFocus = timerMode !== "stopwatch" && focusPercentage === 100;

      const distractionData = {
        totalBlurTime: Math.round(totalBlurTime),
        blurCount,
        focusPercentage: Math.round(focusPercentage),
        isPerfectFocus,
      };

      // Complete session in Firestore
      if (currentSessionId) {
        await completeFocusSession(user.uid, currentSessionId, {
          completed: true,
          distractions: distractionData,
          notes: sessionNotes || undefined,
        });
      }

      // Update stats
      const newStats = await getTodayFocusStats(user.uid);
      setTodayStats(newStats);

      // Check for new achievements
      const totalMinutes = newStats.minutes + (isOvertime ? Math.floor(overtimeSeconds / 60) : 0);
      await checkAchievements(totalMinutes, newStats.sessions, isPerfectFocus);

      // Show session report
      setLastSessionData({
        duration: timerMode === "stopwatch" ? Math.floor((Date.now() - sessionStartTime.current) / 60000) : presetConfig.focusMinutes,
        taskTitle: linkedTaskTitle,
        focusPercentage: Math.round(focusPercentage),
        previousAverage: previousAverageFocus,
        isPerfectFocus,
        distractionCount: blurCount,
        totalDistractTime: Math.round(totalBlurTime),
        overtimeMinutes: isOvertime ? Math.floor(overtimeSeconds / 60) : 0,
        mode: timerMode,
      });
      setShowSessionReport(true);

      // Reset tracking
      setTotalBlurTime(0);
      setBlurCount(0);
      setSessionNotes("");
      setDistractionReasons([]);
      setSessionIntention("");
      setIsOvertime(false);
      setOvertimeSeconds(0);

      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("RT - Focus Timer", {
          body: `${timerMode === "stopwatch" ? "Stopwatch session" : sessionType === "focus" ? "Focus session" : "Break"} complete! ${isPerfectFocus ? "🌟 Perfect Focus!" : ""}`,
        });
      }
    } catch (error) {
      console.error("Failed to complete session:", error);
    }

    setCurrentSessionId(null);
  };

  // ============================================================================
  // ACHIEVEMENTS SYSTEM
  // ============================================================================

  const checkAchievements = async (totalMinutes: number, totalSessions: number, isPerfectFocus: boolean) => {
    if (!user) return;

    const newAchievements: FocusAchievement[] = [];

    // Time-based achievements
    if (totalMinutes >= 60 && !achievements.some(a => a.id === "first_hour")) {
      newAchievements.push({
        id: "first_hour",
        title: "First Hour",
        description: "Complete 60 minutes of focused work",
        icon: "⏰",
        earnedAt: Timestamp.now(),
        category: "time"
      });
    }
    if (totalMinutes >= 600 && !achievements.some(a => a.id === "focus_master")) {
      newAchievements.push({
        id: "focus_master",
        title: "Focus Master",
        description: "Complete 10 hours of focused work",
        icon: "🏆",
        earnedAt: Timestamp.now(),
        category: "time"
      });
    }
    if (totalMinutes >= 3000 && !achievements.some(a => a.id === "deep_work_legend")) {
      newAchievements.push({
        id: "deep_work_legend",
        title: "Deep Work Legend",
        description: "Complete 50 hours of focused work",
        icon: "👑",
        earnedAt: Timestamp.now(),
        category: "time"
      });
    }

    // Session-based achievements
    if (totalSessions >= 1 && !achievements.some(a => a.id === "first_session")) {
      newAchievements.push({
        id: "first_session",
        title: "First Session",
        description: "Complete your first focus session",
        icon: "🎯",
        earnedAt: Timestamp.now(),
        category: "session"
      });
    }
    if (totalSessions >= 10 && !achievements.some(a => a.id === "session_pro")) {
      newAchievements.push({
        id: "session_pro",
        title: "Session Pro",
        description: "Complete 10 focus sessions",
        icon: "🔥",
        earnedAt: Timestamp.now(),
        category: "session"
      });
    }
    if (totalSessions >= 100 && !achievements.some(a => a.id === "century_club")) {
      newAchievements.push({
        id: "century_club",
        title: "Century Club",
        description: "Complete 100 focus sessions",
        icon: "💯",
        earnedAt: Timestamp.now(),
        category: "session"
      });
    }

    // Perfect focus achievements
    if (isPerfectFocus && !achievements.some(a => a.id === "perfect_focus")) {
      newAchievements.push({
        id: "perfect_focus",
        title: "Perfect Focus",
        description: "Complete a session with zero distractions",
        icon: "⭐",
        earnedAt: Timestamp.now(),
        category: "quality"
      });
    }
    if (achievements.filter(a => a.category === "quality" && a.id.startsWith("perfect")).length >= 5 && !achievements.some(a => a.id === "zen_master")) {
      newAchievements.push({
        id: "zen_master",
        title: "Zen Master",
        description: "Achieve perfect focus 5 times",
        icon: "🧘",
        earnedAt: Timestamp.now(),
        category: "quality"
      });
    }

    // Overtime achievements
    if (isOvertime && overtimeSeconds >= 300 && !achievements.some(a => a.id === "flow_state")) {
      newAchievements.push({
        id: "flow_state",
        title: "Flow State",
        description: "Complete 5+ minutes of overtime",
        icon: "🌊",
        earnedAt: Timestamp.now(),
        category: "special"
      });
    }
    if (isOvertime && overtimeSeconds >= 1800 && !achievements.some(a => a.id === "super_flow")) {
      newAchievements.push({
        id: "super_flow",
        title: "Super Flow",
        description: "Complete 30+ minutes of overtime",
        icon: "🚀",
        earnedAt: Timestamp.now(),
        category: "special"
      });
    }

    // Save and show new achievements
    for (const achievement of newAchievements) {
      await saveFocusAchievement(user.uid, achievement);
      setNewAchievement(achievement);
      setTimeout(() => setNewAchievement(null), 5000);
    }

    // Reload achievements
    const updatedAchievements = await getUserAchievements(user.uid);
    setAchievements(updatedAchievements);
  };

  // ============================================================================
  // CONTROL FUNCTIONS
  // ============================================================================

  const toggleTimer = async () => {
    if (!isActive) {
      // Starting a new session
      setIsActive(true);
      setIsPaused(false);

      // Set timestamp references for accurate timing
      const now = Date.now();
      sessionStartTime.current = now;
      timerStartTime.current = now;

      if (timerMode === "stopwatch") {
        targetEndTime.current = now; // No end time in stopwatch mode
      } else {
        targetEndTime.current = now + (minutes * 60 + seconds) * 1000;
      }

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // Create session in Firestore (only for focus sessions)
      if (user && sessionType === "focus" && timerMode !== "stopwatch") {
        try {
          const sessionId = await createFocusSession(user.uid, {
            sessionType,
            duration: presetConfig.focusMinutes,
            preset: currentPreset,
            linkedTaskId: linkedTaskId || undefined,
            linkedTaskTitle: linkedTaskTitle || undefined,
          });
          setCurrentSessionId(sessionId);
        } catch (error) {
          console.error("Failed to create session:", error);
        }
      }
    } else {
      // Pause/Resume
      if (!isPaused && !isOvertime) {
        // Pausing - save current state
        setIsPaused(true);
        setBlurStartTime(Date.now());
        setBlurCount((prev) => prev + 1);
      } else if (isPaused) {
        // Resuming
        setIsPaused(false);
        const now = Date.now();

        if (timerMode === "timer" && !isOvertime) {
          targetEndTime.current = now + (minutes * 60 + seconds) * 1000;
        } else if (isOvertime) {
          targetEndTime.current = now; // Reset overtime reference
        }

        // Close blur tracking
        if (blurStartTime) {
          const blurDuration = (Date.now() - blurStartTime) / 1000;
          setTotalBlurTime((prev) => prev + blurDuration);
          setBlurStartTime(null);
        }
      }
    }
  };

  const resetTimer = async () => {
    // Log intention if setting one before starting
    if (!isActive && sessionIntention) {
      setSessionIntention("");
    }

    // If there's an active session, mark it as abandoned
    if (user && currentSessionId && isActive && !isOvertime) {
      try {
        await updateFocusSession(user.uid, currentSessionId, {
          abandoned: true,
          completed: false,
        });
      } catch (error) {
        console.error("Failed to mark session as abandoned:", error);
      }
    }

    setIsActive(false);
    setIsPaused(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setCurrentSessionId(null);

    if (timerMode === "stopwatch") {
      setMinutes(0);
      setSeconds(0);
      setTotalSeconds(0);
    } else {
      const mins = getDurationForSessionType(sessionType);
      setMinutes(mins);
      setSeconds(0);
      setTotalSeconds(mins * 60);
    }

    // Reset distraction tracking
    setTotalBlurTime(0);
    setBlurCount(0);
    setBlurStartTime(null);
    setDistractionReasons([]);
  };

  // Dynamic time adjustment (+/- 5 minutes)
  const adjustTime = useCallback((deltaMinutes: number) => {
    // START FIX: Allow adjustment while paused
    if (isOvertime) return;

    const deltaSeconds = deltaMinutes * 60;

    // Calculate new total time based on current state
    const currentTotal = minutes * 60 + seconds;
    const newTotal = Math.max(0, currentTotal + deltaSeconds);

    setMinutes(Math.floor(newTotal / 60));
    setSeconds(newTotal % 60);
    setTotalSeconds(newTotal);

    // If active and running, we must also update the target end time
    if (isActive && !isPaused) {
      const now = Date.now();
      targetEndTime.current = now + newTotal * 1000;
    }
  }, [isActive, isPaused, isOvertime, minutes, seconds]);

  const getDurationForSessionType = (type: "focus" | "shortBreak" | "longBreak"): number => {
    switch (type) {
      case "focus":
        return presetConfig.focusMinutes;
      case "shortBreak":
        return presetConfig.shortBreakMinutes;
      case "longBreak":
        return presetConfig.longBreakMinutes;
    }
  };

  const setSession = (type: "focus" | "shortBreak" | "longBreak") => {
    setSessionType(type);
    setIsActive(false);
    setIsPaused(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    const mins = getDurationForSessionType(type);
    setMinutes(mins);
    setSeconds(0);
    setTotalSeconds(mins * 60);
  };

  // Set timer intention before starting
  const setIntention = (intention: string) => {
    setSessionIntention(intention);
  };

  // Log distraction reason when pausing/stopping early
  const logDistraction = (reason: string) => {
    setDistractionReasons(prev => [...prev, { type: reason, timestamp: Date.now() }]);
  };

  // ============================================================================
  // PRESET MANAGEMENT
  // ============================================================================

  const changePreset = (presetId: FocusPresetId, config: FocusPresetConfig) => {
    if (isActive) return; // Don't allow changing presets during active session

    setCurrentPreset(presetId);
    setPresetConfig(config);

    // Update timer with new duration
    const mins = getDurationForSessionType(sessionType);
    setMinutes(mins);
    setSeconds(0);
    setTotalSeconds(mins * 60);
  };

  // ============================================================================
  // MODE MANAGEMENT
  // ============================================================================

  const toggleMode = () => {
    if (isActive) return;
    setTimerMode(prev => prev === "timer" ? "stopwatch" : "timer");
    setMinutes(0);
    setSeconds(0);
    setTotalSeconds(0);
  };

  // ============================================================================
  // THEME MANAGEMENT
  // ============================================================================

  const changeTheme = (theme: TimerTheme) => {
    setTimerTheme(theme);
  };

  // ============================================================================
  // TASK LINKAGE
  // ============================================================================

  const linkTask = (taskId: string, taskTitle: string) => {
    setLinkedTaskId(taskId);
    setLinkedTaskTitle(taskTitle);
  };

  const unlinkTask = () => {
    setLinkedTaskId(null);
    setLinkedTaskTitle(null);
  };

  // ============================================================================
  // RESUME SESSION
  // ============================================================================

  const resumeSession = useCallback(() => {
    if (!incompleteSession) return;

    // Calculate remaining time
    const elapsed = Date.now() - incompleteSession.startTime.toMillis();
    const totalDuration = incompleteSession.duration * 60 * 1000; // milliseconds
    const remaining = Math.max(0, totalDuration - elapsed);

    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);

    setMinutes(remainingMinutes);
    setSeconds(remainingSeconds);
    setSessionType(incompleteSession.sessionType);
    setCurrentSessionId(incompleteSession.id);
    setLinkedTaskId(incompleteSession.linkedTaskId || null);
    setLinkedTaskTitle(incompleteSession.linkedTaskTitle || null);

    setShowResumeDialog(false);
    setIncompleteSession(null);
  }, [incompleteSession]);

  const discardIncompleteSession = useCallback(async () => {
    if (!user || !incompleteSession) return;

    try {
      await updateFocusSession(user.uid, incompleteSession.id, {
        abandoned: true,
        completed: false,
      });
    } catch (error) {
      console.error("Failed to discard session:", error);
    }

    setShowResumeDialog(false);
    setIncompleteSession(null);
  }, [user, incompleteSession]);

  // ============================================================================
  // RETURN VALUES
  // ============================================================================

  return {
    // Timer State
    minutes,
    seconds,
    isActive,
    isPaused,
    sessionType,
    totalSeconds,

    // Timer Mode
    timerMode,
    isOvertime,
    overtimeSeconds,
    toggleMode,

    // Zen Mode
    zenMode,
    setZenMode,

    // Theme
    timerTheme,
    changeTheme,

    // Time Adjustment
    adjustTime,

    // Controls
    toggleTimer,
    resetTimer,
    setSession,

    // Intention
    sessionIntention,
    setIntention,
    distractionReasons,
    logDistraction,

    // Stats
    todayStats,

    // Preset Management
    currentPreset,
    presetConfig,
    changePreset,

    // Task Linkage
    linkedTaskId,
    linkedTaskTitle,
    linkTask,
    unlinkTask,

    // Session Notes
    sessionNotes,
    setSessionNotes,

    // Distraction Tracking
    totalBlurTime,
    blurCount,
    focusPercentage: isActive && !isOvertime
      ? Math.round(
        ((Date.now() - sessionStartTime.current) / 1000 - totalBlurTime) /
        ((Date.now() - sessionStartTime.current) / 1000) *
        100
      )
      : isOvertime ? 100 : 100,

    // Session Report
    showSessionReport,
    setShowSessionReport,
    lastSessionData,

    // Resume Dialog
    showResumeDialog,
    setShowResumeDialog,
    incompleteSession,
    resumeSession,
    discardIncompleteSession,

    // Achievements
    achievements,
    newAchievement,
    setNewAchievement,
  };
};
