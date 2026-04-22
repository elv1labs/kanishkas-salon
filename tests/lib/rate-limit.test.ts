// tests/lib/rate-limit.test.ts
// Unit tests for the in-memory rate limiter

import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  const opts = { max: 3, windowMs: 60_000 };

  it('allows requests under the limit', () => {
    const id = `test-allow-${Date.now()}`;
    const r1 = rateLimit(id, opts);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimit(id, opts);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimit(id, opts);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests over the limit', () => {
    const id = `test-block-${Date.now()}`;
    rateLimit(id, opts);
    rateLimit(id, opts);
    rateLimit(id, opts);

    const blocked = rateLimit(id, opts);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('isolates different identifiers', () => {
    const idA = `test-iso-a-${Date.now()}`;
    const idB = `test-iso-b-${Date.now()}`;
    rateLimit(idA, opts);
    rateLimit(idA, opts);
    rateLimit(idA, opts);

    // B should still be allowed
    const result = rateLimit(idB, opts);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('resets after window expires', async () => {
    const shortOpts = { max: 1, windowMs: 50 }; // 50ms window
    const id = `test-reset-${Date.now()}`;

    rateLimit(id, shortOpts);
    expect(rateLimit(id, shortOpts).success).toBe(false);

    // Wait for window to expire
    await new Promise(r => setTimeout(r, 60));

    const result = rateLimit(id, shortOpts);
    expect(result.success).toBe(true);
  });
});
