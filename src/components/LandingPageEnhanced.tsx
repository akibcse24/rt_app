"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, ArrowRight, Timer, Trophy, BarChart2, Sparkles, User, Layout, Smartphone } from "lucide-react";
import { Button } from "./ui/Button";
import { JsonLd, getFAQSchema, getSoftwareApplicationSchema } from "./JsonLd";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

const features = [
  {
    icon: Timer,
    title: "Focus Engine",
    description: "Immersive timer with ambient sounds to help you enter deep work states effortlessly.",
    color: "from-blue-500/20 to-cyan-500/20"
  },
  {
    icon: Trophy,
    title: "Gamified Leaderboard",
    description: "Compete with friends and the global community. Earn streaks, badges, and rewards.",
    color: "from-yellow-500/20 to-orange-500/20"
  },
  {
    icon: Zap,
    title: "AI Insights",
    description: "Smart analysis of your productivity patterns and personalized routine suggestions.",
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    icon: BarChart2,
    title: "Advanced Analytics",
    description: "Visualize your habits with beautiful charts and data to track your growth over time.",
    color: "from-green-500/20 to-emerald-500/20"
  },
  {
    icon: Sparkles,
    title: "Daily Motivation",
    description: "Receive AI-curated quotes and motivation to keep your spirits high.",
    color: "from-pink-500/20 to-rose-500/20"
  },
  {
    icon: User,
    title: "Personalized Profile",
    description: "Showcase your achievements, streaks, and badges on your custom profile.",
    color: "from-indigo-500/20 to-violet-500/20"
  },
  {
    icon: Layout,
    title: "Smart Templates",
    description: "Use proven productivity templates or create your own to share with the community.",
    color: "from-cyan-500/20 to-blue-500/20"
  },
  {
    icon: Smartphone,
    title: "Works Offline",
    description: "Full PWA support means you can track your habits anywhere, anytime, without internet.",
    color: "from-orange-500/20 to-red-500/20"
  }
];

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


const faqs = [
  {
    question: "Is Routine Tracker really free?",
    answer:
      "Yes! Our core features are completely free forever. We believe everyone deserves access to tools that help them build better habits. Premium features will be added in the future for users who want advanced capabilities.",
  },
  {
    question: "How does the AI assistant work?",
    answer:
      "Our AI analyzes your routine patterns, completion rates, and time distributions to provide personalized insights. It suggests optimal time blocks, identifies productivity peaks, and helps you create sustainable habits.",
  },
  {
    question: "Can I use Routine Tracker offline?",
    answer:
      "Absolutely! The app automatically caches your data and allows full offline functionality. Once you're back online, everything syncs seamlessly with our cloud service.",
  },
  {
    question: "Is my data secure?",
    answer:
      "We take security seriously. All data is encrypted in transit and at rest using industry-standard protocols. We never sell your data, and you can export or delete it at any time.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Routine Tracker is a Progressive Web App (PWA), meaning it works on any device with a browser. You can install it on your phone for an app-like experience without downloading from app stores.",
  },
];

export function LandingPageEnhanced() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <JsonLd
        data={[
          getSoftwareApplicationSchema(),
          getFAQSchema(faqs.map((f) => ({ question: f.question, answer: f.answer }))),
        ]}
      />

      <PublicHeader />

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="container relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Hero Content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-600 dark:text-purple-300 border border-purple-500/20"
            >
              <Zap className="w-4 h-4 fill-purple-500" />
              <span>AI-Powered Routine Tracker</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60"
            >
              Master Your <br />
              <span className="text-purple-500">Daily Flow</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className="text-xl text-muted-foreground max-w-xl leading-relaxed"
            >
              Build rock-solid habits, track your progress, and achieve your goals with our intelligent focus engine and AI-powered analytics.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link href="/login" passHref legacyBehavior>
                <Button
                  className="h-14 px-8 rounded-2xl bg-foreground text-background font-bold text-lg hover:opacity-90 transition-opacity"
                >
                  Get Started <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => scrollToSection("features")}
                className="h-14 px-8 rounded-2xl font-bold text-lg border border-border hover:bg-muted"
              >
                Learn More
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-8 flex items-center gap-8 text-muted-foreground flex-wrap justify-center lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </div>

          {/* Feature Grid Preview instead of Fake Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {features.slice(0, 4).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/80 transition-all cursor-default group"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="font-bold text-foreground mb-2">
                  {feature.title}
                </div>
                <div className="text-sm text-muted-foreground leading-tight">{feature.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Everything you need to <span className="text-purple-500">excel</span></h2>
            <p className="text-lg text-muted-foreground">Our comprehensive suite of tools helps you manage time, track habits, and stay motivated every single day.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about Routine Tracker.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-border/50 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-6 text-left bg-card/50 hover:bg-card transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                    className="text-muted-foreground"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </motion.span>
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to Transform Your Daily Routine?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Start building better habits today with our intelligent tracking system.
          </p>
          <Link href="/login" passHref legacyBehavior>
            <Button
              className="h-14 px-10 rounded-2xl bg-foreground text-background font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Start Free Today
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
