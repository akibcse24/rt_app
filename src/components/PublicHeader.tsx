"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Moon, Sun, ArrowRight, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export function PublicHeader() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "Templates", href: "/marketplace" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-6 left-0 right-0 z-50 mx-4 md:mx-auto max-w-7xl rounded-full glass-premium flex h-20 items-center justify-between px-6 md:px-8 transition-all duration-300 border border-white/40 shadow-2xl shadow-purple-900/10 backdrop-blur-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300 group">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full" />
            <div className="relative h-11 w-11 rounded-full border-2 border-white/50 shadow-sm bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              RT
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
            Routine Tracker
          </h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors hover:scale-105"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleTheme}
            className="flex relative rounded-full transition-all hover:rotate-12 neu-convex"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-400 fill-yellow-400/20 transition-all duration-300" />
            ) : (
              <Moon className="h-5 w-5 text-purple-500 fill-purple-500/20 transition-all duration-300" />
            )}
          </Button>

          <Link href="/login">
            <Button
              className="hidden md:flex h-10 px-6 rounded-full bg-foreground text-background font-bold hover:opacity-90 transition-opacity"
            >
              Sign In
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-32 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-bold text-foreground"
                >
                  {link.name}
                </Link>
              ))}
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full h-14 px-12 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xl">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
