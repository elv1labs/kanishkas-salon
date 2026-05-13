import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound,
  apiRateLimited, apiMethodNotAllowed, parseJsonBody, validatePagination,
  buildPaginationMeta, handlePrismaError, createRequestTimer,
  sanitizeLogInput,
} from '@/lib/api-utils';

describe('apiSuccess', () => {
  it('returns 200 with success: true and spread data', async () => {
    const res = apiSuccess({ orders: [], count: 5 });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.orders).toEqual([]);
    expect(body.count).toBe(5);
  });

  it('supports custom status codes', async () => {
    const res = apiSuccess({ id: '123' }, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.id).toBe('123');
  });

  it('includes requestId and timestamp in meta', async () => {
    const res = apiSuccess({});
    const body = await res.json();
    expect(body.meta).toBeDefined();
    expect(body.meta.requestId).toMatch(/^req_/);
    expect(body.meta.timestamp).toBeDefined();
  });

  it('includes pagination in meta when provided', async () => {
    const pagination = { page: 1, limit: 10, total: 25, pages: 3, hasNext: true, hasPrev: false };
    const res = apiSuccess({ items: [] }, 200, { pagination });
    const body = await res.json();
    expect(body.meta.pagination).toEqual(pagination);
  });

  it('includes X-Request-Id header', () => {
    const res = apiSuccess({});
    expect(res.headers.get('X-Request-Id')).toMatch(/^req_/);
  });

  it('includes rate limit headers when provided', () => {
    const rateLimit = { limit: 10, remaining: 5, resetMs: 60000 };
    const res = apiSuccess({}, 200, { rateLimit });
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('5');
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('accepts custom requestId', () => {
    const res = apiSuccess({}, 200, { requestId: 'req_custom' });
    expect(res.headers.get('X-Request-Id')).toBe('req_custom');
  });
});

describe('apiError', () => {
  it('returns 400 by default with success: false', async () => {
    const res = apiError('Validation failed');
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('supports custom status and details', async () => {
    const details = { field: 'email', message: 'required' };
    const res = apiError('Bad input', 422, details);
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error.details).toEqual(details);
  });

  it('maps status to correct error code', async () => {
    const tests = [
      { status: 401, code: 'UNAUTHORIZED' },
      { status: 403, code: 'FORBIDDEN' },
      { status: 404, code: 'NOT_FOUND' },
      { status: 409, code: 'CONFLICT' },
      { status: 429, code: 'RATE_LIMITED' },
      { status: 500, code: 'INTERNAL_ERROR' },
    ];
    for (const { status, code } of tests) {
      const res = apiError('msg', status);
      const body = await res.json();
      expect(body.error.code).toBe(code);
    }
  });

  it('accepts explicit error code override', async () => {
    const res = apiError('Custom', 400, undefined, 'DATABASE_ERROR');
    const body = await res.json();
    expect(body.error.code).toBe('DATABASE_ERROR');
  });

  it('falls back to INTERNAL_ERROR for unmapped status', async () => {
    const res = apiError('weird', 499);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('includes X-Content-Type-Options header', () => {
    const res = apiError('err');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('apiUnauthorized', () => {
  it('returns 401 with default message', async () => {
    const res = apiUnauthorized();
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Unauthorized');
  });

  it('accepts custom message', async () => {
    const res = apiUnauthorized('Session expired');
    const body = await res.json();
    expect(body.error.message).toBe('Session expired');
  });
});

describe('apiForbidden', () => {
  it('returns 403 with default message', async () => {
    const res = apiForbidden();
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toBe('Forbidden');
  });

  it('accepts custom message', async () => {
    const res = apiForbidden('Not authorized for this action');
    const body = await res.json();
    expect(body.error.message).toBe('Not authorized for this action');
  });
});

describe('apiNotFound', () => {
  it('returns 404', async () => {
    const res = apiNotFound('Order not found');
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Order not found');
  });

  it('uses default message when omitted', async () => {
    const res = apiNotFound();
    const body = await res.json();
    expect(body.error.message).toBe('Not Found');
  });
});

describe('apiRateLimited', () => {
  it('returns 429 with default message', async () => {
    const res = apiRateLimited();
    const body = await res.json();
    expect(res.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(body.error.message).toBe('Too many requests. Please try again later.');
  });

  it('includes rate limit info when provided', async () => {
    const rateLimit = { limit: 5, remaining: 0, resetMs: 30000 };
    const res = apiRateLimited('Slow down', rateLimit);
    const body = await res.json();
    expect(body.error.message).toBe('Slow down');
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});

describe('apiMethodNotAllowed', () => {
  it('returns 405 with Allow header', () => {
    const res = apiMethodNotAllowed(['GET', 'POST']);
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, POST');
  });

  it('lists allowed methods in error message', async () => {
    const res = apiMethodNotAllowed(['GET']);
    const body = await res.json();
    expect(body.error.message).toContain('GET');
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });
});

describe('parseJsonBody', () => {
  it('parses valid JSON body', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const { data, error } = await parseJsonBody(req);
    expect(data).toEqual({ name: 'test' });
    expect(error).toBeNull();
  });

  it('returns error for malformed JSON', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const { data, error } = await parseJsonBody(req);
    expect(data).toBeNull();
    expect(error).toBeDefined();
    const errBody = await (error as any).json();
    expect(errBody.error.code).toBe('BAD_REQUEST');
    expect(errBody.error.message).toBe('Invalid JSON body');
  });

  it('returns 400 for empty body', async () => {
    const req = new Request('http://localhost', { method: 'POST', body: '' });
    const { data, error } = await parseJsonBody(req);
    expect(data).toBeNull();
    expect(error).toBeDefined();
  });

  it('parses array JSON body', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify([1, 2, 3]),
      headers: { 'Content-Type': 'application/json' },
    });
    const { data, error } = await parseJsonBody(req);
    expect(data).toEqual([1, 2, 3]);
    expect(error).toBeNull();
  });
});

describe('validatePagination', () => {
  it('returns defaults when no params', () => {
    const params = new URLSearchParams();
    const result = validatePagination(params);
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('parses page and limit from params', () => {
    const params = new URLSearchParams({ page: '3', limit: '20' });
    const result = validatePagination(params);
    expect(result).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('clamps page to minimum 1', () => {
    const params = new URLSearchParams({ page: '-5' });
    const result = validatePagination(params);
    expect(result.page).toBe(1);
  });

  it('clamps limit to maxLimit', () => {
    const params = new URLSearchParams({ limit: '999' });
    const result = validatePagination(params, { maxLimit: 50 });
    expect(result.limit).toBe(50);
  });

  it('uses custom defaults', () => {
    const params = new URLSearchParams();
    const result = validatePagination(params, { page: 2, limit: 25 });
    expect(result).toEqual({ page: 2, limit: 25, skip: 25 });
  });

  it('clamps page to 1 when page is 0', () => {
    const params = new URLSearchParams({ page: '0' });
    const result = validatePagination(params);
    expect(result.page).toBe(1);
  });

  it('clamps limit to minimum 1', () => {
    const params = new URLSearchParams({ limit: '-1' });
    const result = validatePagination(params);
    expect(result.limit).toBe(1);
  });

  it('handles non-numeric page gracefully', () => {
    const params = new URLSearchParams({ page: 'abc' });
    const result = validatePagination(params);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('uses default maxLimit of 100', () => {
    const params = new URLSearchParams({ limit: '200' });
    const result = validatePagination(params);
    expect(result.limit).toBe(100);
  });
});

describe('buildPaginationMeta', () => {
  it('builds correct metadata for first page', () => {
    const meta = buildPaginationMeta(1, 10, 25);
    expect(meta).toEqual({
      page: 1, limit: 10, total: 25, pages: 3,
      hasNext: true, hasPrev: false,
    });
  });

  it('builds correct metadata for middle page', () => {
    const meta = buildPaginationMeta(2, 10, 25);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it('builds correct metadata for last page', () => {
    const meta = buildPaginationMeta(3, 10, 25);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });

  it('handles single page', () => {
    const meta = buildPaginationMeta(1, 10, 5);
    expect(meta.pages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });

  it('handles zero total', () => {
    const meta = buildPaginationMeta(1, 10, 0);
    expect(meta.pages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });

  it('handles exact divisibility', () => {
    const meta = buildPaginationMeta(2, 10, 20);
    expect(meta.pages).toBe(2);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });
});

describe('handlePrismaError', () => {
  it('handles P2002 unique constraint violation', async () => {
    const error = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
      'Unique constraint', { code: 'P2002', clientVersion: '5.0' }
    );
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe('CONFLICT');
  });

  it('handles P2025 record not found', async () => {
    const error = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
      'Not found', { code: 'P2025', clientVersion: '5.0' }
    );
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('handles P2003 foreign key violation', async () => {
    const error = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
      'FK violation', { code: 'P2003', clientVersion: '5.0' }
    );
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('handles P2014 required relation violation', async () => {
    const error = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
      'Required relation', { code: 'P2014', clientVersion: '5.0' }
    );
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('handles generic PrismaClientKnownRequestError', async () => {
    const error = new (require('@prisma/client').Prisma.PrismaClientKnownRequestError)(
      'Unknown', { code: 'P2000', clientVersion: '5.0' }
    );
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('DATABASE_ERROR');
  });

  it('handles PrismaClientValidationError', async () => {
    const Prisma = require('@prisma/client').Prisma;
    const error = new Prisma.PrismaClientValidationError('Invalid data', { clientVersion: '5.0' });
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error.code).toBe('UNPROCESSABLE_ENTITY');
  });

  it('handles generic errors as 500', async () => {
    const error = new Error('Something broke');
    const res = handlePrismaError(error);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('createRequestTimer', () => {
  it('returns elapsed time in milliseconds', async () => {
    const timer = createRequestTimer();
    await new Promise(r => setTimeout(r, 10));
    const elapsed = timer.elapsed();
    expect(elapsed).toBeGreaterThanOrEqual(5);
  });

  it('returns 0 when called immediately', () => {
    const timer = createRequestTimer();
    expect(timer.elapsed()).toBeGreaterThanOrEqual(0);
  });

  it('can be called multiple times', async () => {
    const timer = createRequestTimer();
    const first = timer.elapsed();
    await new Promise(r => setTimeout(r, 5));
    const second = timer.elapsed();
    expect(second).toBeGreaterThanOrEqual(first);
  });
});

describe('sanitizeLogInput', () => {
  it('replaces newlines with spaces', () => {
    expect(sanitizeLogInput('line1\nline2')).toBe('line1 line2');
  });

  it('replaces carriage returns with spaces', () => {
    expect(sanitizeLogInput('line1\rline2')).toBe('line1 line2');
  });

  it('replaces tabs with spaces', () => {
    expect(sanitizeLogInput('col1\tcol2')).toBe('col1 col2');
  });

  it('truncates long input', () => {
    const long = 'a'.repeat(500);
    expect(sanitizeLogInput(long).length).toBe(200);
  });

  it('preserves normal strings', () => {
    expect(sanitizeLogInput('normal log entry')).toBe('normal log entry');
  });

  it('handles empty string', () => {
    expect(sanitizeLogInput('')).toBe('');
  });

  it('respects custom maxLength', () => {
    expect(sanitizeLogInput('hello world', 5)).toBe('hello');
  });
});
