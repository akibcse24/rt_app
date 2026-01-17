"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { X, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TourStep {
    title: string;
    description: string;
    targetId?: string; // ID of the element to highlight (optional)
    position?: "center" | "top" | "bottom";
}

const STEPS: TourStep[] = [
    {
        title: "Welcome to RT!",
        description: "Let's take a quick tour to help you build your perfect routine.",
        position: "center",
    },
    {
        title: "Your Daily Flow",
        description: "These 6 time blocks are your canvas. Fill them with habits to structure your day.",
        position: "center", // Ideally this would point to the grid, but center is safe
    },
    {
        title: "Add a Task",
        description: "Click here to add your first habit or routine. You can set days, times, and icons.",
        targetId: "add-task-trigger", // We need to add this ID to the ProgressBar button
        position: "bottom",
    },
    {
        title: "Stay Focused",
        description: "Use the Focus page to enter deep work mode with ambient sounds and a timer.",
        position: "center",
    },
];

// App version - increment this when there are major updates
const APP_VERSION = "1.0.0";

const OnboardingTour: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const checkIfShouldShowTour = async () => {
            if (!user) return;

            try {
                // Check if user has seen this version of the tour
                const tourData = localStorage.getItem("rt_tour_data");
                let shouldShow = true;

                if (tourData) {
                    const { version, hasSeen } = JSON.parse(tourData);

                    // If user has seen the current version, don't show
                    if (hasSeen && version === APP_VERSION) {
                        shouldShow = false;
                    }
                }

                // For existing users (old accounts), check if they have any tasks
                // If they have tasks, they're an existing user - skip tour unless version changed
                if (shouldShow) {
                    const tasksRef = collection(db, "tasks");
                    const userTasksQuery = query(
                        tasksRef,
                        where("userId", "==", user.uid),
                        limit(1)
                    );

                    const snapshot = await getDocs(userTasksQuery);

                    // If user has existing tasks, they're not a new user
                    if (!snapshot.empty) {
                        const tourData = localStorage.getItem("rt_tour_data");
                        if (tourData) {
                            const { version } = JSON.parse(tourData);
                            // Only show if version changed (indicating an update)
                            if (version === APP_VERSION) {
                                shouldShow = false;
                            }
                        } else {
                            // Old user without tour data - mark as seen without showing
                            localStorage.setItem("rt_tour_data", JSON.stringify({
                                version: APP_VERSION,
                                hasSeen: true
                            }));
                            shouldShow = false;
                        }
                    }
                }

                if (shouldShow) {
                    // Small delay to allow UI to load
                    const timer = setTimeout(() => setIsOpen(true), 1500);
                    return () => clearTimeout(timer);
                }
            } catch (e) {
                console.error("Error checking tour status:", e);
            }
        };

        checkIfShouldShowTour();
    }, [user]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsOpen(false);
        try {
            localStorage.setItem("rt_tour_data", JSON.stringify({
                version: APP_VERSION,
                hasSeen: true,
                completedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.error("Error saving tour completion:", e);
        }
    };

    const handleSkip = () => {
        setIsOpen(false);
        try {
            localStorage.setItem("rt_tour_data", JSON.stringify({
                version: APP_VERSION,
                hasSeen: true,
                skippedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.error("Error saving tour skip:", e);
        }
    };

    if (!isOpen) return null;

    const step = STEPS[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleSkip}
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-card p-8 shadow-2xl border border-border"
                >
                    {/* Progress Indicators */}
                    <div className="flex gap-2 mb-6 justify-center">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? "w-8 bg-purple-500" : "w-1.5 bg-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="text-center space-y-4 mb-8">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">
                            {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-muted font-medium"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/20"
                        >
                            {currentStep === STEPS.length - 1 ? (
                                <span className="flex items-center gap-2">
                                    Get Started <Check className="w-4 h-4" />
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Next <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export { OnboardingTour };
