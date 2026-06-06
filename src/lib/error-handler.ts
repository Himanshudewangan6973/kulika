// src/lib/error-handler.ts
/**
 * @file src/lib/error-handler.ts
 * @description Standardized error handling utility for Kulika's API routes.
 * Provides the KulikaError class for custom application errors and the
 * withErrorHandler higher-order function to catch and format API errors uniformly.
 * Requirement: Ensures API responses never hard-crash and always return a consistent JSON structure.
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

export class KulikaError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'KulikaError';
  }
}

export const errorCodes = {
  // Auth errors
  UNAUTHORIZED: { code: 'UNAUTHORIZED', statusCode: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', statusCode: 403 },
  
  // Validation errors
  INVALID_REQUEST: { code: 'INVALID_REQUEST', statusCode: 400 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', statusCode: 400 },
  
  // Resource errors
  NOT_FOUND: { code: 'NOT_FOUND', statusCode: 404 },
  ALREADY_EXISTS: { code: 'ALREADY_EXISTS', statusCode: 409 },
  
  // Server errors
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', statusCode: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', statusCode: 503 },
};

export function createErrorResponse(
  error: Error | KulikaError,
  requestId: string
) {
  if (error instanceof KulikaError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: error.statusCode }
    );
  }

  // Generic error
  const isDev = process.env.NODE_ENV === 'development';
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isDev ? error.message : 'An unexpected error occurred',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: 500 }
  );
}

export function withErrorHandler(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const requestId = crypto.randomUUID();

    try {
      return await handler(request, context);
    } catch (error) {
      logger.error(`[${requestId}] Error`, { error });
      return createErrorResponse(error as Error, requestId);
    }
  };
}
