import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale, CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Terms of Service | Routine Tracker",
  description: "Terms of Service agreement governing your use of Routine Tracker. Please read these terms carefully before using our services.",
};

export default function TermsPage() {
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
            <Scale className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Last updated: January 12, 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Routine Tracker's web application and related services (collectively, the "Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Routine Tracker provides a web-based productivity application designed to help users track routines, manage tasks, set goals, and improve their daily habits. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
            <p className="mb-4 text-muted-foreground">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span>Provide accurate, current, and complete information during registration</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span>Maintain the security of your password and account</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span>Accept responsibility for all activities that occur under your account</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-purple-500" />
                <span>Notify us immediately of any unauthorized use of your account</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">4. Acceptable Use</h2>
            <p className="mb-4 text-muted-foreground">
              You agree not to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any systems or networks</li>
              <li>Transmit viruses, worms, or any other harmful code</li>
              <li>Collect or store personal data about other users without permission</li>
              <li>Use the Service in a way that could damage, disable, or impair our servers</li>
              <li>Reverse engineer, decompile, or attempt to derive the source code of the Service</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">5. Intellectual Property</h2>
            <p className="mb-4 text-muted-foreground">
              The Service, including its original content, features, functionality, and design, is owned by Routine Tracker and is protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without express written permission.
            </p>
            <p className="text-muted-foreground">
              You retain ownership of any data, content, or routines you create and store using the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">6. User-Generated Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of content you create and store in the Service. By using the Service, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process your content solely for the purpose of providing the Service to you.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">7. Disclaimers</h2>
            <p className="mb-4 text-muted-foreground">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
            </p>
            <p className="text-muted-foreground">
              Routine Tracker is a productivity tool and should not be used as a substitute for professional medical, psychological, or financial advice.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              IN NO EVENT SHALL ROUTINE TRACKER, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">9. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide notice prior to any new terms taking effect. Your continued use of the Service after any such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">12. Contact Information</h2>
            <p className="mb-4 text-muted-foreground">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-purple-500" />
                <span className="text-foreground">Email: terms@routinetracker.app</span>
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
