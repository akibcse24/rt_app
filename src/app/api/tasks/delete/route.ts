// ============================================================================
// TASKS API - DELETE TASK
// ============================================================================
// DELETE /api/tasks/delete
// Deletes a task for the authenticated user
// Uses standardized API wrapper with validation, rate limiting, and error handling

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { withRateLimit, withErrorHandling } from "@/lib/apiHelpers";
import { logger } from "@/lib/logger";

interface DeleteTaskBody {
  userId: string;
  taskId: string;
}

/**
 * DELETE /api/tasks/delete
 * Deletes a task for the authenticated user
 */
export const DELETE = withErrorHandling(
  withRateLimit(
    async (request: NextRequest) => {
      const body: DeleteTaskBody = await request.json();
      const { userId, taskId } = body;

      // Validate required fields
      if (!userId || !taskId) {
        return NextResponse.json(
          { error: "User ID and Task ID are required", code: "MISSING_IDS" },
          { status: 400 }
        );
      }

      // Delete from Firestore
      await deleteDoc(doc(db, "users", userId, "tasks", taskId));

      logger.info("Task deleted via API", {
        action: "DELETE /api/tasks/delete",
        metadata: { userId, taskId }
      });

      return NextResponse.json({
        success: true,
        taskId,
        message: "Task deleted successfully"
      });

    },
    { maxRequests: 30, windowMs: 60000, identifier: "tasks_delete" }
  ),
  { endpoint: "/api/tasks/delete", method: "DELETE" }
);
