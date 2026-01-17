// ============================================================================
// TASKS API - ADD TASK
// ============================================================================
// POST /api/tasks/add
// Creates a new task for the authenticated user
// Uses standardized API wrapper with validation, rate limiting, and error handling

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, type Firestore, type DocumentReference } from "firebase/firestore";
import { withRateLimit, withErrorHandling } from "@/lib/apiHelpers";
import { validateTask, sanitizeForFirestore } from "@/lib/validationSchemas";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

// Cast db to proper Firestore type
const firestoreDb: Firestore = db as unknown as Firestore;

interface AddTaskBody {
  userId: string;
  taskData: Record<string, unknown>;
}

/**
 * POST /api/tasks/add
 * Creates a new task for the authenticated user
 */
export const POST = withErrorHandling(
  withRateLimit(
    async (request: NextRequest) => {
      const body: AddTaskBody = await request.json();
      const { userId, taskData } = body;

      // Validate required fields
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required", code: "MISSING_USER_ID" },
          { status: 400 }
        );
      }

      if (!taskData) {
        return NextResponse.json(
          { error: "Task data is required", code: "MISSING_TASK_DATA" },
          { status: 400 }
        );
      }

      // Validate task data using Zod schema
      const validationResult = validateTask(taskData);
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: "Invalid task data", code: "INVALID_TASK_DATA", details: validationResult.errors },
          { status: 400 }
        );
      }

      // Create new task with generated ID
      const newTask = sanitizeForFirestore({
        id: uuidv4(),
        ...taskData,
        isCompleted: false,
        completionHistory: [],
        createdAt: new Date().toISOString(),
      } as Record<string, unknown>);

      // Save to Firestore - use type assertion to work around TypeScript issue
      // @ts-expect-error - TypeScript overload resolution issue with Firebase types
      const taskDocRef = doc(firestoreDb, "users", userId, "tasks", newTask.id) as DocumentReference<Record<string, unknown>>;
      await setDoc(taskDocRef, newTask as Record<string, unknown>);

      logger.info("Task created via API", {
        action: "POST /api/tasks/add",
        metadata: { userId, taskId: newTask.id }
      });

      return NextResponse.json({
        success: true,
        task: newTask,
        message: "Task created successfully"
      }, { status: 201 });

    },
    { maxRequests: 30, windowMs: 60000, identifier: "tasks_add" }
  ),
  { endpoint: "/api/tasks/add", method: "POST" }
);
