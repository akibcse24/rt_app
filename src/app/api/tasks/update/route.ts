// ============================================================================
// TASKS API - UPDATE TASK
// ============================================================================
// PUT /api/tasks/update
// Updates an existing task for the authenticated user
// Uses standardized API wrapper with validation, rate limiting, and error handling

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { withRateLimit, withErrorHandling } from "@/lib/apiHelpers";
import { validateTask, sanitizeForFirestore } from "@/lib/validationSchemas";
import { logger } from "@/lib/logger";

interface UpdateTaskBody {
  userId: string;
  taskId: string;
  updates: Record<string, unknown>;
}

/**
 * PUT /api/tasks/update
 * Updates an existing task for the authenticated user
 */
export const PUT = withErrorHandling(
  withRateLimit(
    async (request: NextRequest) => {
      const body: UpdateTaskBody = await request.json();
      const { userId, taskId, updates } = body;

      // Validate required fields
      if (!userId || !taskId) {
        return NextResponse.json(
          { error: "User ID and Task ID are required", code: "MISSING_IDS" },
          { status: 400 }
        );
      }

      if (!updates || Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: "Updates are required", code: "MISSING_UPDATES" },
          { status: 400 }
        );
      }

      // Validate updates using partial task validation
      const validationResult = validateTask({ ...updates, id: taskId });
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: "Invalid task updates", code: "INVALID_UPDATES", details: validationResult.errors },
          { status: 400 }
        );
      }

      // Sanitize updates and add timestamp
      const finalUpdates = sanitizeForFirestore({
        ...updates,
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>);

      // Remove undefined values
      Object.keys(finalUpdates).forEach(key => {
        if (finalUpdates[key as keyof typeof finalUpdates] === undefined) {
          delete finalUpdates[key as keyof typeof finalUpdates];
        }
      });

      // Update in Firestore
      await updateDoc(doc(db, "users", userId, "tasks", taskId), finalUpdates);

      logger.info("Task updated via API", {
        action: "PUT /api/tasks/update",
        metadata: { userId, taskId }
      });

      return NextResponse.json({
        success: true,
        taskId,
        updates: finalUpdates,
        message: "Task updated successfully"
      });

    },
    { maxRequests: 30, windowMs: 60000, identifier: "tasks_update" }
  ),
  { endpoint: "/api/tasks/update", method: "PUT" }
);
