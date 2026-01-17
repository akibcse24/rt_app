// ============================================================================
// API ROUTE WRAPPER - ERROR HANDLING & VALIDATION
// ============================================================================
// Provides higher-order functions for standardizing API route behavior
// with proper error handling, validation, and response formatting.

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_PRESETS } from './rateLimit';
import { logger } from './logger';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fieldErrors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR', { fieldErrors });
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter }, retryAfter);
  }
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log the error
  logger.apiError(context || 'API', 'UNKNOWN', error, 500);

  // Handle custom API errors
  if (error instanceof ApiError) {
    const response: Record<string, unknown> = {
      success: false,
      error: error.message,
      code: error.code,
    };

    if (error.details) {
      response.details = error.details;
    }

    if (error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Firebase errors
  if (error instanceof Error) {
    const errorCode = (error as { code?: string }).code;

    if (errorCode?.startsWith('auth/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      );
    }

    if (errorCode === 'permission-denied') {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to perform this action',
          code: 'PERMISSION_DENIED',
        },
        { status: 403 }
      );
    }
  }

  // Handle unknown errors
  console.error('Unhandled API error:', error);
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

// ============================================================================
// RATE LIMIT WRAPPER
// ============================================================================

type RouteHandler = (request: NextRequest) => Promise<NextResponse>;

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
  message?: string;
}

type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitPreset | Partial<RateLimitConfig> = 'default'
): RouteHandler {
  const rateLimitConfig = typeof config === 'string' 
    ? RATE_LIMIT_PRESETS[config]
    : { 
        windowMs: config.windowMs || 60000, 
        maxRequests: config.maxRequests || 100, 
        message: config.message,
        keyPrefix: config.identifier ? `rl_${config.identifier}_` : 'rl_'
      };

  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = checkRateLimit(request, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitConfig.message || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    return handler(request);
  };
}

// ============================================================================
// ASYNC WRAPPER FOR SAFETY
// ============================================================================

interface ErrorHandlingOptions {
  endpoint?: string;
  method?: string;
  skipRateLimit?: boolean;
}

export function withErrorHandling<T extends RouteHandler>(
  fn: T, 
  _options?: ErrorHandlingOptions
): T {
  return (async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await fn(request);
    } catch (error) {
      // Pass validation errors through, otherwise wrap or log
      if (error instanceof ApiError) {
         return handleApiError(error);
      }

      console.error('Function error:', error);
      return handleApiError(error);
    }
  }) as T;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

export function errorResponse(
  message: string,
  code: string = 'ERROR',
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code, details },
    { status }
  );
}

export function created<T>(data: T): NextResponse {
  return successResponse(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export function parsePagination(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams;

  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))),
    orderBy: searchParams.get('orderBy') || 'createdAt',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
  };
}

export function paginateResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number
): PaginationResult<T> {
  const { page = 1, limit = 20 } = params;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
// All functions and classes are already exported at their definition sites
// No additional exports needed here
