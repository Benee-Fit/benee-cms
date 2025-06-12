import { z } from 'zod';

// Report validation schemas
export const createReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  clientId: z.string().uuid().optional().nullable(),
  data: z.any(), // JSON data
  documentIds: z.array(z.string()).optional().default([]),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export const updateReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  clientId: z.string().uuid().optional().nullable(),
  data: z.any().optional(), // JSON data
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Share link validation schemas
export const createShareLinkSchema = z.object({
  expiresAt: z.string().datetime().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable(),
});

export const updateShareLinkSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

// Email sharing validation schema
export const emailShareSchema = z.object({
  shareToken: z.string().min(1, 'Share token is required'),
  recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required'),
  subject: z.string().max(200, 'Subject must be less than 200 characters').optional(),
  message: z.string().max(2000, 'Message must be less than 2000 characters').optional(),
});

// Validation helper functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateShareToken(token: string): boolean {
  // Share tokens are 64-character hex strings
  const tokenRegex = /^[a-f0-9]{64}$/i;
  return tokenRegex.test(token);
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
}

// Error handling classes
export class ValidationError extends Error {
  public field: string;
  public code: string;

  constructor(message: string, field: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  public code: string;

  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
  }
}

export class NotFoundError extends Error {
  public resource: string;
  public code: string;

  constructor(resource: string, code: string = 'NOT_FOUND') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.code = code;
  }
}

export class RateLimitError extends Error {
  public retryAfter: number;
  public code: string;

  constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60, code: string = 'RATE_LIMIT') {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.code = code;
  }
}

// Generic error response formatter
export function formatError(error: unknown): {
  message: string;
  code: string;
  field?: string;
  details?: any;
} {
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: error.code,
      field: error.field,
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      message: error.message,
      code: error.code,
      details: { resource: error.resource },
    };
  }

  if (error instanceof RateLimitError) {
    return {
      message: error.message,
      code: error.code,
      details: { retryAfter: error.retryAfter },
    };
  }

  if (error instanceof z.ZodError) {
    return {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'INTERNAL_ERROR',
    };
  }

  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}