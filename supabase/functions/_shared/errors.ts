// Common error handling utilities
import { ApiResponse } from './types.ts'
import { ValidationException } from './validation.ts'
import { AuthError } from './auth.ts'

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // External API errors
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_API_TIMEOUT: 'EXTERNAL_API_TIMEOUT',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

// Custom error classes
export class AppError extends Error {
  code: ErrorCode
  statusCode: number
  details?: any
  
  constructor(
    message: string, 
    code: ErrorCode, 
    statusCode: number = 500, 
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`
    super(message, ERROR_CODES.NOT_FOUND, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.CONFLICT, 409, details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, ERROR_CODES.FORBIDDEN, 403)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ERROR_CODES.RATE_LIMIT_EXCEEDED, 429)
  }
}

export class ExternalApiError extends AppError {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.EXTERNAL_API_ERROR, 502, details)
  }
}

// Error response creation
export function createErrorResponse(
  error: Error,
  path?: string
): Response {
  let statusCode = 500
  let errorCode: ErrorCode = ERROR_CODES.INTERNAL_ERROR
  let message = 'Internal server error'
  let details: any = undefined
  
  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode
    errorCode = error.code
    message = error.message
    details = error.details
  } else if (error instanceof AuthError) {
    statusCode = error.code === 'AUTH_REQUIRED' ? 401 : 403
    errorCode = error.code as ErrorCode
    message = error.message
  } else if (error instanceof ValidationException) {
    statusCode = 400
    errorCode = ERROR_CODES.VALIDATION_ERROR
    message = 'Validation failed'
    details = error.errors
  } else {
    // Log unexpected errors
    console.error('Unexpected error:', error)
  }
  
  const response: ApiResponse = {
    error: {
      code: errorCode,
      message,
      details
    },
    timestamp: new Date().toISOString(),
    path
  }
  
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }
  })
}

// Success response creation
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    data,
    timestamp: new Date().toISOString()
  }
  
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }
  })
}

// CORS preflight response
export function createCorsResponse(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  })
}

// Error handling middleware
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        return createCorsResponse()
      }
      
      return await handler(req)
    } catch (error) {
      const url = new URL(req.url)
      return createErrorResponse(error as Error, url.pathname)
    }
  }
}

// Async error wrapper
export async function asyncTryCatch<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof AppError || error instanceof AuthError || error instanceof ValidationException) {
      throw error
    }
    
    throw new AppError(
      errorMessage || 'Operation failed',
      ERROR_CODES.INTERNAL_ERROR,
      500,
      error
    )
  }
}

// Database error handler
export function handleDatabaseError(error: any): never {
  console.error('Database error:', error)
  
  // Handle specific database error codes
  if (error.code === '23505') { // Unique constraint violation
    throw new ConflictError('Resource already exists', error.detail)
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    throw new AppError(
      'Referenced resource does not exist',
      ERROR_CODES.INVALID_INPUT,
      400,
      error.detail
    )
  }
  
  if (error.code === '23514') { // Check constraint violation
    throw new AppError(
      'Invalid data provided',
      ERROR_CODES.VALIDATION_ERROR,
      400,
      error.detail
    )
  }
  
  // Generic database error
  throw new AppError(
    'Database operation failed',
    ERROR_CODES.DATABASE_ERROR,
    500,
    error
  )
}

// Rate limiting helper
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  storage: Map<string, { count: number; resetTime: number }> = new Map()
): void {
  const now = Date.now()
  const key = identifier
  const record = storage.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    storage.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return
  }
  
  if (record.count >= limit) {
    throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`)
  }
  
  record.count++
  storage.set(key, record)
}

// Validation helper
export function validateAndThrowIfErrors(errors: any[]): void {
  if (errors.length > 0) {
    throw new ValidationException(errors)
  }
}

// Resource existence checker
export function assertResourceExists<T>(
  resource: T | null | undefined,
  resourceName: string,
  id?: string
): T {
  if (!resource) {
    throw new NotFoundError(resourceName, id)
  }
  return resource
}

// Permission checker
export function assertPermission(
  condition: boolean,
  message: string = 'Access forbidden'
): void {
  if (!condition) {
    throw new ForbiddenError(message)
  }
}

// Logging utilities
export function logError(error: Error, context?: any): void {
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context
  })
}

export function logInfo(message: string, data?: any): void {
  console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '')
}

export function logWarning(message: string, data?: any): void {
  console.warn(`[WARNING] ${message}`, data ? JSON.stringify(data) : '')
}