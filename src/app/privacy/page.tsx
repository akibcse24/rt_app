import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Privacy Policy | Routine Tracker",
  description: "Our commitment to protecting your privacy and data. Learn how Routine Tracker collects, uses, and safeguards your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
              RT
            </div>
            <span className="text-xl font-bold">Routine Tracker</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 12, 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Routine Tracker ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and related services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">2. Information We Collect</h2>
            <p className="mb-4 text-muted-foreground">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span><strong>Account Information:</strong> Username, email address (if signing up with Google), and authentication data when you create an account.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span><strong>Routine & Task Data:</strong> Information about your routines, tasks, time blocks, goals, and achievements that you create or track within the app.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span><strong>Usage Data:</strong> Information about how you interact with our app, including feature usage, session duration, and performance metrics.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span><strong>Device Information:</strong> Device type, operating system, browser type, and network information.</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="mb-4 text-muted-foreground">
              We use the information we collect to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Develop new features and products</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">4. Data Storage & Security</h2>
            <p className="mb-4 text-muted-foreground">
              Your data is stored securely using Firebase Cloud Firestore, which provides enterprise-grade security features. We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-muted-foreground">
              All data is encrypted in transit and at rest using industry-standard encryption protocols. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy. You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">6. Your Rights</h2>
            <p className="mb-4 text-muted-foreground">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">7. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">8. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">9. Contact Us</h2>
            <p className="mb-4 text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-purple-500" />
                <span className="text-foreground">Email: privacy@routinetracker.app</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Routine Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
