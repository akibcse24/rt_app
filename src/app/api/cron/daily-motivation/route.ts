// ============================================================================
// DAILY MOTIVATION CRON JOB
// ============================================================================
// GET /api/cron/daily-motivation
// Runs at 6 AM daily to prepare daily motivation messages for all users.
// Schedule: 0 6 * * * (Every day at 6:00 AM UTC)

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { withErrorHandling } from "@/lib/apiHelpers";
import { logger } from "@/lib/logger";

// Verify the request is from Vercel Cron
function verifyCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * GET /api/cron/daily-motivation
 * Creates daily motivation notifications for all users
 */
export const GET = withErrorHandling(
  async (_request: Request) => {
    // In production, verify the cron secret
    if (process.env.NODE_ENV === "production") {
      if (!verifyCronRequest(_request)) {
        return NextResponse.json(
          { error: "Unauthorized", code: "UNAUTHORIZED_CRON" },
          { status: 401 }
        );
      }
    }

    logger.info("Daily motivation cron job started", { action: "cron/daily-motivation" });

    const usersSnapshot = await getDocs(collection(db, "users"));
    let notificationsCreated = 0;
    let errors = 0;

    const motivationalMessages = [
      "Consistency is key! Every journey starts with a single step.",
      "You are capable of amazing things. Keep pushing!",
      "Small progress is still progress. Keep going!",
      "Your potential is endless. Go do what you were created to do.",
      "Discipline is choosing between what you want now and what you want most.",
      "Success is the sum of small efforts repeated day in and day out.",
      "Don't watch the clock; do what it does. Keep going!",
      "The only way to do great work is to love what you do.",
    ];

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

        // Create notification in Firestore
        const notificationRef = doc(collection(db, "users", userId, "notifications"));
        await setDoc(notificationRef, {
          type: "info",
          title: "Daily Motivation ✨",
          message: randomMessage,
          createdAt: new Date().toISOString(),
          read: false,
        });

        notificationsCreated++;
      } catch (userError) {
        errors++;
        logger.warn(`Failed to create notification for user`, userError);
      }
    }

    logger.info(`Daily motivation completed: ${notificationsCreated} notifications created, ${errors} errors`, {
      action: "cron/daily-motivation",
      metadata: { notificationsCreated, errors },
    });

    return NextResponse.json({
      success: true,
      message: `Daily motivation job completed`,
      notificationsCreated,
      errors,
      timestamp: new Date().toISOString(),
    });

  },
  { endpoint: "/api/cron/daily-motivation", method: "GET", skipRateLimit: true }
);

export const dynamic = "force-dynamic";
