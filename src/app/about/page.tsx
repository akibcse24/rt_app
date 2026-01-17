"use client";

import React from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { motion } from "framer-motion";
import { Sparkles, Target, Users, Code, Heart, User as UserIcon } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-purple-500/30">
      <PublicHeader />

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 mb-24">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="container mx-auto text-center relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-600 dark:text-purple-300 border border-purple-500/20 mb-6"
            >
              <Sparkles className="w-4 h-4 fill-purple-500" />
              <span>Our Story</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60"
            >
              Building the future of <span className="text-purple-500">Productivity</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground leading-relaxed"
            >
              We believe that discipline isn't about restriction—it's about freedom.
              The freedom to achieve your wildest dreams through consistent, daily action.
            </motion.p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-4 mb-24">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="glass-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Target className="w-16 h-16 text-purple-500 mb-6" />
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To empower individuals to master their time and attention in an increasingly distracted world.
                  We build tools that blend psychology, technology, and design to make high performance accessible to everyone.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                 <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Community First</h3>
                        <p className="text-muted-foreground">We build for our users, listening to feedback and evolving with their needs.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500">
                        <Code className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Technical Excellence</h3>
                        <p className="text-muted-foreground">We obsess over performance, security, and a seamless user experience.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                        <Heart className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Human Centric</h3>
                        <p className="text-muted-foreground">Technology should serve humans, not the other way around. We design for digital wellbeing.</p>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Creator Section */}
        <section className="px-4">
          <div className="container mx-auto max-w-4xl text-center">
             <h2 className="text-3xl font-bold mb-12">Meet the Creator</h2>

             <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-premium p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden inline-block text-left"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-32 h-32 rounded-full neu-convex flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-1">
                        <UserIcon className="w-16 h-16 text-foreground" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold mb-2">Crytonix Anonigale</h3>
                        <p className="text-purple-500 font-medium mb-4">Founder & Lead Engineer</p>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            "I built Routine Tracker because I needed a better way to manage my own chaotic schedule.
                            What started as a weekend project has grown into a tool that helps thousands of people reclaim their time."
                        </p>
                        <div className="flex justify-center md:justify-start gap-4">
                            <a href="https://github.com/akibcse24" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-muted-foreground hover:text-purple-500 transition-colors">
                                @akibcse24
                            </a>
                            <span className="text-muted-foreground">•</span>
                            <a href="mailto:canonigale@gmail.com" className="text-sm font-bold text-muted-foreground hover:text-purple-500 transition-colors">
                                canonigale@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
             </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
