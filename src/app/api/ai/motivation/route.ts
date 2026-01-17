// ============================================================================
// AI API - MOTIVATION GENERATOR
// ============================================================================
// POST /api/ai/motivation
// Generates personalized motivational messages using Gemini AI
// Uses standardized API wrapper with validation, rate limiting, and error handling

import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, withErrorHandling } from "@/lib/apiHelpers";
import { sanitizeString } from "@/lib/validationSchemas";
import { logger } from "@/lib/logger";

interface MotivationBody {
  tasks?: Array<{ title: string; startTime: string }>;
  userName?: string;
}

// Initialize the Gemini AI client
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * POST /api/ai/motivation
 * Generates personalized motivational messages
 */
export const POST = withErrorHandling(
  withRateLimit(
    async (request: NextRequest) => {
      const body: MotivationBody = await request.json();
      const { tasks, userName } = body;

      // Sanitize inputs
      const sanitizedUserName = sanitizeString(userName || "there", 50);

      const ai = getAIClient();

      // Build a prompt for motivation
      let tasksContext = "The user has no tasks today.";
      if (tasks?.length) {
        tasksContext = `The user has the following tasks today:\n${tasks.map((t) => `- ${sanitizeString(t.title, 100)} at ${t.startTime}`).join("\n")}`;
      }

      const prompt = `You are a motivational coach for a routine tracking app. Generate a short, personalized, encouraging message (2-3 sentences max) to motivate the user to complete their tasks today.

${tasksContext}

User's name: ${sanitizedUserName}

Be warm, specific to their tasks if possible, and inspiring. Use an emoji at the start.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const motivation = response.text || "🌟 You've got this! Every task you complete today brings you closer to your goals. Let's make it a great day!";

      logger.info("Motivation generated via AI", {
        action: "POST /api/ai/motivation",
        metadata: { taskCount: tasks?.length || 0 }
      });

      return NextResponse.json({ motivation });

    },
    { maxRequests: 30, windowMs: 60000, identifier: "ai_motivation" }
  ),
  { endpoint: "/api/ai/motivation", method: "POST" }
);
