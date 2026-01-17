// ============================================================================
// RATE LIMITING UTILITIES - ENHANCED VERSION
// ============================================================================
// Provides rate limiting for API routes to prevent abuse and ensure fair usage.
// Supports multiple rate limit configurations for different endpoint types.

import { NextRequest, NextResponse } from "next/server";

// In-memory store for rate limiting (for serverless, consider using Upstash Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  keyPrefix?: string; // Custom key prefix
}

// Preset configurations for different endpoint types
const RATE_LIMIT_PRESETS = {
  // Stricter limits for authentication endpoints
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 attempts per minute
    message: "Too many authentication attempts. Please try again in a minute.",
    keyPrefix: "rl_auth_",
  },
  // AI endpoints - expensive operations
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    message: "AI request limit reached. Please try again in a minute.",
    keyPrefix: "rl_ai_",
  },
  // General API endpoints
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: "Too many requests. Please try again later.",
    keyPrefix: "rl_",
  },
  // Leaderboard - read-heavy, cache longer
  leaderboard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: "Leaderboard request limit reached. Please try again later.",
    keyPrefix: "rl_leaderboard_",
  },
};

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: "Too many requests. Please try again later.",
  keyPrefix: "rl_",
};

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  // Fallback to a default identifier
  return forwarded?.split(",")[0] || realIp || cfConnectingIp || "anonymous";
}

/**
 * Clean up expired entries (called periodically)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number; limit: number } {
  const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_CONFIG, ...config };

  const clientId = getClientId(request);
  const prefix = keyPrefix || DEFAULT_CONFIG.keyPrefix;
  const key = `${prefix}${clientId}`;
  const now = Date.now();

  // Cleanup old entries periodically (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
      limit: maxRequests,
    };
  }

  if (existing.count >= maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
      limit: maxRequests,
    };
  }

  // Increment counter
  existing.count++;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetTime: existing.resetTime,
    limit: maxRequests,
  };
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): NextResponse | null {
  const result = checkRateLimit(request, config);
  const { message } = { ...DEFAULT_CONFIG, ...config };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: message,
        retryAfter: retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
        },
      }
    );
  }

  // Return null if allowed (handler continues)
  // Note: We skip setting success headers here to avoid NextResponse.next() usage in route handlers
  return null;
}

/**
 * Use a preset configuration by name
 */
export function withPreset(
  request: NextRequest,
  presetName: keyof typeof RATE_LIMIT_PRESETS
): NextResponse | null {
  return withRateLimit(request, RATE_LIMIT_PRESETS[presetName]);
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function rateLimited<T extends (request: NextRequest) => Promise<NextResponse>>(
  handler: T,
  config: Partial<RateLimitConfig> = {}
): T {
  return (async (request: NextRequest) => {
    const rateLimitResponse = withRateLimit(request, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    return handler(request);
  }) as T;
}

/**
 * Create a rate limit middleware function with a specific preset
 */
export function createRateLimiter(presetName: keyof typeof RATE_LIMIT_PRESETS) {
  return (request: NextRequest) => withPreset(request, presetName);
}

// Export presets for external use
export { RATE_LIMIT_PRESETS };
export type { RateLimitConfig };
