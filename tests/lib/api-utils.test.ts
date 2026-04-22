// tests/lib/api-utils.test.ts
// Unit tests for API utility functions

import { describe, it, expect } from 'vitest';
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound, validatePagination } from '@/lib/api-utils';

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
});

describe('apiError', () => {
  it('returns 400 by default with success: false', async () => {
    const res = apiError('Validation failed');
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
  });

  it('supports custom status and details', async () => {
    const details = { field: 'email', message: 'required' };
    const res = apiError('Bad input', 422, details);
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.details).toEqual(details);
  });
});

describe('apiUnauthorized', () => {
  it('returns 401 with default message', async () => {
    const res = apiUnauthorized();
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('accepts custom message', async () => {
    const res = apiUnauthorized('Session expired');
    const body = await res.json();
    expect(body.error).toBe('Session expired');
  });
});

describe('apiForbidden', () => {
  it('returns 403', async () => {
    const res = apiForbidden();
    expect(res.status).toBe(403);
  });
});

describe('apiNotFound', () => {
  it('returns 404', async () => {
    const res = apiNotFound('Order not found');
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe('Order not found');
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
});
