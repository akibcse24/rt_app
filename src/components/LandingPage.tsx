"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { User, Lock, Sparkles, Trophy, ArrowRight, Check, Timer, BarChart2, Zap, Mail, Github } from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components for Landing Page Sections ---

const FeatureCard = ({ icon: Icon, title, description, color }: any) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative overflow-hidden rounded-[2rem] glass-premium border-white/10 p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-500 group-hover:opacity-10`} />
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl neu-convex transition-transform duration-500 group-hover:scale-110">
            <Icon className="h-8 w-8 text-foreground" />
        </div>
        <h3 className="mb-3 text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed font-medium">
            {description}
        </p>
    </motion.div>
);

const StepCard = ({ number, title, description }: any) => (
    <div className="relative flex flex-col items-center text-center p-6 z-10">
        <div className="neu-convex mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl font-bold text-white shadow-lg shadow-purple-500/30">
            {number}
        </div>
        <h3 className="mb-3 text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed max-w-xs font-medium">
            {description}
        </p>
    </div>
);

// --- Main Landing Page Component ---

const LandingPage: React.FC = () => {
    const { login, register, loginWithGoogle } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!username || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            if (isRegistering) {
                await register(username, password);
            } else {
                await login(username, password);
            }
        } catch (err: any) {
            console.error(err);
            switch (err.code) {
                case "auth/email-already-in-use":
                    setError("This username is already taken.");
                    break;
                case "auth/invalid-email":
                    setError("Invalid characters in username.");
                    break;
                case "auth/weak-password":
                    setError("Password should be at least 6 characters.");
                    break;
                case "auth/user-not-found":
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    setError("Invalid username or password.");
                    break;
                default:
                    setError(err.message || "An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/popup-closed-by-user") {
                setError("Sign in was cancelled.");
            } else {
                setError(err.message || "Failed to sign in with Google.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-purple-500/30">

            {/* --- HERO SECTION --- */}
            <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 lg:py-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[8000ms]" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="container relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">

                    {/* Hero Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full glass-premium px-5 py-2 text-sm font-bold text-purple-500 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                            <Sparkles className="w-4 h-4 fill-purple-500 animate-pulse" />
                            <span className="tracking-wide uppercase text-[10px]">AI-Powered Routine Tracker</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground drop-shadow-2xl">
                            Master Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Daily Flow</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
                            Build rock-solid habits, track your progress, and achieve your goals with our intelligent focus engine and analytics.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto pt-4">
                            <Button className="neu-convex h-16 px-10 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/25">
                                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button variant="ghost" className="neu-flat hover:neu-convex h-16 px-10 rounded-2xl font-bold text-lg hover:bg-white/5 transition-all">
                                How it Works
                            </Button>
                        </div>

                        <div className="pt-8 flex flex-wrap justify-center lg:justify-start gap-6 text-sm font-bold text-muted-foreground/80">
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                <Check className="w-5 h-5 text-green-500" />
                                <span>Free Forever Plan</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                <Check className="w-5 h-5 text-green-500" />
                                <span>No Credit Card</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Login/Signup Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="w-full max-w-md mx-auto lg:ml-auto"
                    >
                        <div className="glass-premium rounded-[2.5rem] p-8 shadow-2xl border-white/20 relative overflow-hidden">
                            {/* Card Decor */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

                            <div className="mb-8 text-center relative z-10">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {isRegistering ? "Start your journey" : "Welcome back"}
                                </h2>
                                <p className="text-sm font-medium text-muted-foreground mt-2">
                                    {isRegistering
                                        ? "Create an account to track your progress"
                                        : "Enter your credentials to continue"}
                                </p>
                            </div>

                            {/* Google Sign In Button */}
                            <Button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="neu-convex w-full h-14 bg-white/5 hover:bg-white/10 text-foreground font-bold rounded-2xl mb-8 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] border-white/10"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </Button>

                            <div className="relative mb-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                                    <span className="bg-transparent px-3 text-muted-foreground backdrop-blur-xl">Or continue with email</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Username</label>
                                    <Input
                                        type="text"
                                        required
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        leftIcon={<User className="w-4 h-4" />}
                                        className="neu-concave h-14 bg-transparent border-transparent text-foreground placeholder:text-muted-foreground/50 rounded-2xl focus:ring-purple-500/30"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        leftIcon={<Lock className="w-4 h-4" />}
                                        className="neu-concave h-14 bg-transparent border-transparent text-foreground placeholder:text-muted-foreground/50 rounded-2xl focus:ring-purple-500/30"
                                    />
                                    {isRegistering && <p className="text-[10px] text-muted-foreground ml-1 font-medium">At least 6 characters</p>}
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-bold text-center animate-in fade-in slide-in-from-top-2">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="neu-convex w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold rounded-2xl text-white shadow-lg shadow-purple-500/25 text-lg"
                                >
                                    {loading ? "Processing..." : isRegistering ? "Create Account" : "Sign In"}
                                </Button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {isRegistering ? "Already have an account? " : "New to Routine Tracker? "}
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(!isRegistering)}
                                        className="font-bold text-purple-400 hover:text-purple-300 transition-colors ml-1 hover:underline decoration-2 underline-offset-4"
                                    >
                                        {isRegistering ? "Sign In" : "Sign Up Free"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="py-32 relative">
                 <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-900/5 to-background pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter drop-shadow-lg">Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">excel</span></h2>
                        <p className="text-lg text-muted-foreground font-medium">Our comprehensive suite of tools helps you manage time, track habits, and stay motivated every single day.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Timer}
                            title="Focus Engine"
                            description="Immersive timer with ambient sounds to help you enter deep work states effortlessly."
                            color="from-blue-500/20 to-cyan-500/20"
                        />
                        <FeatureCard
                            icon={Trophy}
                            title="Gamified Leaderboard"
                            description="Compete with friends and the global community. Earn streaks, badges, and rewards."
                            color="from-yellow-500/20 to-orange-500/20"
                        />
                        <FeatureCard
                            icon={Zap}
                            title="AI Insights"
                            description="Smart analysis of your productivity patterns and personalized routine suggestions."
                            color="from-purple-500/20 to-pink-500/20"
                        />
                        <FeatureCard
                             icon={BarChart2}
                             title="Advanced Analytics"
                             description="Visualize your habits with beautiful charts and data to track your growth over time."
                             color="from-green-500/20 to-emerald-500/20"
                        />
                        <FeatureCard
                             icon={Sparkles}
                             title="Daily Motivation"
                             description="Receive AI-curated quotes and motivation to keep your spirits high."
                             color="from-pink-500/20 to-rose-500/20"
                        />
                         <FeatureCard
                             icon={User}
                             title="Personalized Profile"
                             description="Showcase your achievements, streaks, and badges on your custom profile."
                             color="from-indigo-500/20 to-violet-500/20"
                        />
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS SECTION --- */}
            <section className="py-32 bg-background relative overflow-hidden">
                {/* Connecting Line Background */}
                 <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent hidden lg:block" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">How it works</h2>
                        <p className="text-muted-foreground font-medium text-lg">Three simple steps to a better you.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        <StepCard
                            number="1"
                            title="Create Routines"
                            description="Set up your daily habits and organize them into time blocks like Morning, Afternoon, and Night."
                        />
                        <StepCard
                            number="2"
                            title="Track & Focus"
                            description="Use the Focus Engine to execute tasks without distractions and mark them as complete."
                        />
                        <StepCard
                            number="3"
                            title="Analyze Growth"
                            description="View detailed analytics, maintain your streak, and climb the leaderboard."
                        />
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-20 border-t border-white/5 bg-black/40 backdrop-blur-xl relative overflow-hidden">
                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                         <h2 className="text-3xl font-bold mb-10 tracking-tight">Let's Connect</h2>

                         <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24">
                            {/* Creator */}
                            <div className="flex flex-col items-center gap-4 group">
                                <div className="neu-convex h-20 w-20 rounded-[1.5rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/5">
                                    <User className="h-8 w-8 text-foreground" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Creator</p>
                                    <p className="text-lg font-bold text-foreground">Crytonix Anonigale</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex flex-col items-center gap-4 group">
                                <div className="neu-convex h-24 w-24 rounded-[1.8rem] flex items-center justify-center bg-blue-500 shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:scale-110">
                                    <Mail className="h-10 w-10 text-white" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Email</p>
                                    <a href="mailto:canonigale@gmail.com" className="text-lg font-bold text-foreground hover:text-blue-400 transition-colors">
                                        canonigale@gmail.com
                                    </a>
                                </div>
                            </div>

                            {/* Github */}
                            <div className="flex flex-col items-center gap-4 group">
                                <div className="neu-convex h-20 w-20 rounded-[1.5rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/5">
                                    <Github className="h-8 w-8 text-foreground" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Github</p>
                                    <a href="https://github.com/akibcse24" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-foreground hover:text-purple-400 transition-colors">
                                        @akibcse24
                                    </a>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="w-full h-px bg-white/5 mb-10" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-lg opacity-80 grayscale hover:grayscale-0 transition-all" />
                            <span className="font-bold">Routine Tracker</span>
                        </div>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
                            <a href="#" className="hover:text-purple-400 transition-colors">Contact</a>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60">
                            © 2026 Crytonix. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export { LandingPage };
