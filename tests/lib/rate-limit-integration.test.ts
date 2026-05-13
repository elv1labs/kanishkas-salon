import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyRateLimit } from '@/lib/api-utils';

function mockRequest(ip = '127.0.0.1'): Request {
  return new Request('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('applyRateLimit', () => {
  it('returns null for requests under the limit', () => {
    const req = mockRequest('apply-allow-1');
    const result = applyRateLimit(req, 'test:action', { max: 5, windowMs: 60_000 });
    expect(result).toBeNull();
  });

  it('returns 429 when limit is exceeded', () => {
    const req = mockRequest('apply-block-1');
    for (let i = 0; i < 5; i++) {
      applyRateLimit(req, 'test:burst', { max: 5, windowMs: 60_000 });
    }
    const blocked = applyRateLimit(req, 'test:burst', { max: 5, windowMs: 60_000 });
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
  });

  it('isolates different IPs', () => {
    const reqA = mockRequest('iso-a');
    const reqB = mockRequest('iso-b');

    for (let i = 0; i < 3; i++) {
      applyRateLimit(reqA, 'test:iso', { max: 3, windowMs: 60_000 });
    }
    expect(applyRateLimit(reqA, 'test:iso', { max: 3, windowMs: 60_000 })!.status).toBe(429);
    expect(applyRateLimit(reqB, 'test:iso', { max: 3, windowMs: 60_000 })).toBeNull();
  });

  it('isolates different actions for the same IP', () => {
    const req = mockRequest('action-iso');
    for (let i = 0; i < 3; i++) {
      applyRateLimit(req, 'action-one', { max: 3, windowMs: 60_000 });
    }
    expect(applyRateLimit(req, 'action-one', { max: 3, windowMs: 60_000 })!.status).toBe(429);
    expect(applyRateLimit(req, 'action-two', { max: 3, windowMs: 60_000 })).toBeNull();
  });
});
