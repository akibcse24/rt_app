"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Home, MoveLeft, SearchX } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[4000ms]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-premium relative z-10 flex flex-col items-center justify-center space-y-8 p-12 rounded-[3rem] shadow-2xl border-white/20 max-w-2xl text-center"
      >
        <div className="relative">
          <div className="neu-convex h-40 w-40 rounded-full flex items-center justify-center bg-white/5 animate-float-slow">
             <SearchX className="h-20 w-20 text-purple-500/50" />
          </div>
          <motion.h1
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.2, type: "spring" }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-pink-600 opacity-20 pointer-events-none"
          >
            404
          </motion.h1>
        </div>

        <div className="space-y-3 z-10">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Lost in the Void?</h2>
          <p className="text-muted-foreground text-lg max-w-[400px] mx-auto leading-relaxed">
            The page you are looking for seems to have drifted away into deep space.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <Link href="/">
            <Button className="neu-convex h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 font-bold text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all">
              <Home className="mr-2 h-5 w-5" />
              Return Home
            </Button>
          </Link>
          <Link href="/">
             <Button variant="ghost" className="neu-flat hover:neu-convex h-14 rounded-2xl px-6 font-bold text-muted-foreground hover:text-foreground transition-all">
               <MoveLeft className="mr-2 h-5 w-5" />
               Go Back
             </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
