"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, Settings, LayoutTemplate, Menu, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/Button";
import { TemplatesModal } from "./TemplatesModal";
import { SettingsModal } from "./SettingsModal";
import { NotificationCenter } from "./NotificationCenter";
import { motion } from "framer-motion";

import { useUI } from "@/context/UIContext";

const Header: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toggleSidebar } = useUI();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="sticky top-6 z-50 mx-4 md:mx-auto max-w-7xl rounded-full glass-premium flex h-20 items-center justify-between px-6 md:px-8 transition-all duration-300 border border-white/40 shadow-2xl shadow-purple-900/10 float-animation"
      >
        <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 group">
          <div className="relative">
             <div className="absolute inset-0 bg-purple-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full" />
             <img
                src="/logo.jpg"
                alt="RT Logo"
                className="relative h-11 w-11 rounded-full border-2 border-white/50 shadow-sm"
              />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block text-glow">
            Routine Tracker
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          <NotificationCenter />

          <Button
            variant="secondary"
            size="icon"
            onClick={toggleTheme}
            className="flex relative rounded-full transition-all hover:rotate-12 neu-convex"
            aria-label="Toggle theme"
          >
            {/*
              Using conditional rendering ensures the correct icon is always shown
              based on the resolved theme state, avoiding CSS class reliance issues.
              Standard Toggle Pattern: Show Sun if Dark (to switch to Light), Show Moon if Light (to switch to Dark).
            */}
            {mounted && resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-400 fill-yellow-400/20 transition-all duration-300" />
            ) : (
              <Moon className="h-5 w-5 text-purple-500 fill-purple-500/20 transition-all duration-300" />
            )}
          </Button>

          <Link
            href="/marketplace"
            className="hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-muted-foreground hover:text-primary transition-all neu-convex hover:scale-105 active:scale-95"
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="hidden md:inline text-sm font-bold">Templates</span>
          </Link>

          <Button
            variant="secondary"
            onClick={() => setIsSettingsOpen(true)}
            size="icon"
            className="rounded-full transition-all px-3 md:w-auto md:px-4"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden md:inline text-sm font-bold ml-2">Settings</span>
          </Button>

          <Button
            onClick={toggleSidebar}
            className="h-12 w-12 rounded-full shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 border-white/20 transition-transform active:scale-90 p-0 flex items-center justify-center hover:shadow-purple-500/40 hover:rotate-180 duration-500"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </motion.header>

      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export { Header };
