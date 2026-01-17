"use client";

import React, { useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { motion } from "framer-motion";
import { Mail, Send, MapPin, Github } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-purple-500/30">
      <PublicHeader />

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 mb-16 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
                    Get in <span className="text-purple-500">Touch</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Have questions about Routine Tracker? We're here to help you on your journey to productivity mastery.
                </p>
            </motion.div>
        </section>

        <section className="px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div className="glass-premium p-8 rounded-3xl border-white/10">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Mail className="w-6 h-6 text-purple-500" />
                                Contact Information
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                                        <a href="mailto:canonigale@gmail.com" className="text-lg font-medium hover:text-purple-500 transition-colors">
                                            canonigale@gmail.com
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-1">Expect a reply within 24 hours.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                                        <Github className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">GitHub</p>
                                        <a href="https://github.com/akibcse24" target="_blank" rel="noopener noreferrer" className="text-lg font-medium hover:text-pink-500 transition-colors">
                                            @akibcse24
                                        </a>
                                        <p className="text-sm text-muted-foreground mt-1">Follow our development journey.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                                        <p className="text-lg font-medium">
                                            Dhaka, Bangladesh
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">Remote-first operations.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-premium p-8 rounded-3xl border-white/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                            <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                            <p className="text-muted-foreground mb-4">
                                Need immediate answers? Check out our FAQ section on the home page or documentation.
                            </p>
                            <Button variant="outline" className="w-full justify-between" onClick={() => window.location.href = '/#faq'}>
                                Go to FAQs <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="glass-premium p-8 md:p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden">
                            {/* Decorative Blur */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

                            {isSubmitted ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center text-center h-[500px]"
                                >
                                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                                        <Send className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                                    <p className="text-muted-foreground mb-8 max-w-xs">
                                        Thank you for reaching out. We've received your message and will get back to you shortly.
                                    </p>
                                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                                        Send Another Message
                                    </Button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">Send us a message</h3>
                                    <p className="text-muted-foreground mb-6">Fill out the form below and we'll get back to you as soon as possible.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground ml-1">Name</label>
                                            <Input
                                                required
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="neu-concave h-12 rounded-xl bg-transparent border-transparent"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-muted-foreground ml-1">Email</label>
                                            <Input
                                                required
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="neu-concave h-12 rounded-xl bg-transparent border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground ml-1">Subject</label>
                                        <Input
                                            required
                                            placeholder="How can we help?"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                            className="neu-concave h-12 rounded-xl bg-transparent border-transparent"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground ml-1">Message</label>
                                        <textarea
                                            required
                                            rows={5}
                                            placeholder="Tell us more about your inquiry..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            className="w-full neu-concave rounded-xl bg-transparent border-transparent p-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-14 neu-convex bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            "Sending..."
                                        ) : (
                                            <>Send Message <Send className="w-5 h-5" /></>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

// Icon for the button
function ArrowRight({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
