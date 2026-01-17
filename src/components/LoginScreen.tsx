"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { User, Lock, Mail, CheckCircle, ArrowRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LoginScreen: React.FC = () => {
  const { login, register, loginWithGoogle, sendEmailVerification, user, isEmailVerified } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        await register(email, password);
        setVerificationSent(true);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already in use. Try signing in instead.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address format.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid email or password.");
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

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification();
      setVerificationSent(true);
    } catch (err: any) {
      setError("Failed to send verification email. Please try again.");
    }
  };

  // Show verification pending screen
  if (user && !isEmailVerified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col items-center">
            <div className="neu-convex flex h-24 w-24 items-center justify-center rounded-[2rem] text-yellow-500 mb-8 p-1">
               <div className="h-full w-full rounded-[1.8rem] bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                  <Mail className="w-10 h-10" />
               </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3 text-center">Verify Your Email</h1>
            <p className="text-muted-foreground font-medium text-center max-w-sm">
              We've sent a verification link to <span className="text-purple-400 font-bold">{user.email}</span>
            </p>
          </div>

          <div className="glass-premium rounded-[2.5rem] p-8 shadow-2xl border-white/20 space-y-6">
            <div className="neu-concave flex items-start gap-4 p-5 rounded-2xl">
              <Mail className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                Click the link in your email to verify your account. You need to verify to unlock all features.
              </p>
            </div>

            {verificationSent && (
              <div className="flex items-center gap-3 text-green-400 text-sm font-bold bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                <CheckCircle className="w-4 h-4" />
                <span>Verification email sent!</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Button
                onClick={handleResendVerification}
                disabled={loading}
                className="h-14 neu-convex rounded-2xl bg-white/5 hover:bg-white/10 text-foreground font-bold border-white/10 hover:scale-[1.02] active:scale-[0.98]"
              >
                Resend Verification Email
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="h-14 neu-convex rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                I've Verified My Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[5000ms]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center group">
          <div className="neu-convex p-1 rounded-[1.5rem] mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
             <img
                src="/logo.jpg"
                alt="RT Logo"
                className="h-24 w-24 rounded-[1.3rem] shadow-inner"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2 drop-shadow-lg">Routine Tracker</h1>
          <p className="text-muted-foreground font-medium text-lg">Build unbreakable discipline</p>
        </div>

        <div className="glass-premium rounded-[2.5rem] p-8 shadow-2xl border-white/20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-2">
              {isRegistering
                ? "Start your journey to better habits"
                : "Sign in to continue your streak"}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                 <Input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<User className="w-4 h-4" />}
                    className="neu-concave h-14 bg-transparent border-transparent text-foreground placeholder:text-muted-foreground/50 rounded-2xl focus:ring-purple-500/30"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Password</label>
                 <Input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="neu-concave h-14 bg-transparent border-transparent text-foreground placeholder:text-muted-foreground/50 rounded-2xl focus:ring-purple-500/30"
                 />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-bold text-red-400 text-center">{error}</p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="neu-convex w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold rounded-2xl text-white shadow-lg shadow-purple-500/25 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? "Please wait..." : (
                  <>
                     {isRegistering ? "Sign Up" : "Sign In"}
                     <ArrowRight className="w-5 h-5" />
                  </>
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm font-medium text-muted-foreground">
                {isRegistering ? "Already have an account? " : "New user? "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="font-bold text-purple-400 hover:text-purple-300 transition-colors ml-1"
                >
                  {isRegistering ? "Sign In" : "Create Account"}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { LoginScreen };
