import { describe, it, expect, beforeEach, vi } from 'vitest';

// We use dynamic imports with vi.resetModules() because csrf.ts has a
// module-level ALLOWED_ORIGINS cache that is populated on first call.
// Each test group calls loadModule() to get a fresh instance.

async function loadModule(env: Record<string, string>) {
  for (const [key, val] of Object.entries(env)) {
    vi.stubEnv(key, val);
  }
  vi.resetModules();
  return import('@/lib/csrf');
}

describe('validateCsrfOrigin — safe methods', () => {
  it('allows GET requests without origin', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/services', { method: 'GET' });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('allows HEAD requests', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/health', { method: 'HEAD' });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('allows OPTIONS requests', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/services', { method: 'OPTIONS' });
    expect(validateCsrfOrigin(req)).toBeNull();
  });
});

describe('validateCsrfOrigin — Origin header', () => {
  it('allows request with matching Origin', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/appointments', {
      method: 'POST',
      headers: { Origin: 'https://kanishkassalon.com' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('blocks request with non-matching Origin', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/appointments', {
      method: 'POST',
      headers: { Origin: 'https://evil.com' },
    });
    expect(validateCsrfOrigin(req)).toContain('CSRF blocked');
    expect(validateCsrfOrigin(req)).toContain('evil.com');
  });

  it('allows origin from CSRF_ALLOWED_ORIGINS env', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      CSRF_ALLOWED_ORIGINS: 'https://admin.kanishkassalon.com, https://app2.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/services', {
      method: 'POST',
      headers: { Origin: 'https://admin.kanishkassalon.com' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('allows multiple origins from CSRF_ALLOWED_ORIGINS', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      CSRF_ALLOWED_ORIGINS: 'https://admin.kanishkassalon.com, https://app2.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/test', {
      method: 'PATCH',
      headers: { Origin: 'https://app2.com' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });
});

describe('validateCsrfOrigin — Referer fallback', () => {
  it('uses Referer when Origin is absent', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/appointments', {
      method: 'POST',
      headers: { Referer: 'https://kanishkassalon.com/book' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('blocks request with non-matching Referer', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/appointments', {
      method: 'POST',
      headers: { Referer: 'https://phishing.com/fake-form' },
    });
    expect(validateCsrfOrigin(req)).toContain('CSRF blocked');
  });

  it('handles malformed Referer', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/appointments', {
      method: 'POST',
      headers: { Referer: 'not-a-url' },
    });
    expect(validateCsrfOrigin(req)).toContain('malformed referer');
  });
});

describe('validateCsrfOrigin — missing headers in production', () => {
  it('blocks POST with no Origin or Referer in production', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/appointments', { method: 'POST' });
    expect(validateCsrfOrigin(req)).toContain('missing Origin');
  });

  it('blocks PUT with no Origin or Referer', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/services/1', { method: 'PUT' });
    expect(validateCsrfOrigin(req)).toContain('missing Origin');
  });

  it('blocks DELETE with no Origin or Referer', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/services/1', { method: 'DELETE' });
    expect(validateCsrfOrigin(req)).toContain('missing Origin');
  });

  it('blocks PATCH with no Origin or Referer', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/resources/1', { method: 'PATCH' });
    expect(validateCsrfOrigin(req)).toContain('missing Origin');
  });
});

describe('validateCsrfOrigin — cron secret bypass', () => {
  it('allows requests with valid cron secret', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
      CRON_SECRET: 'test-cron-secret',
    });
    const req = new Request('https://kanishkassalon.com/api/cron/appointment-reminders', {
      method: 'POST',
      headers: { 'x-cron-secret': 'test-cron-secret' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('blocks requests with invalid cron secret', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
      CRON_SECRET: 'test-cron-secret',
    });
    const req = new Request('https://kanishkassalon.com/api/cron/appointment-reminders', {
      method: 'POST',
      headers: { 'x-cron-secret': 'wrong-secret' },
    });
    expect(validateCsrfOrigin(req)).toContain('CSRF blocked');
  });
});

describe('validateCsrfOrigin — development mode', () => {
  it('allows requests without origin in development', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'development',
    });
    const req = new Request('http://localhost:3000/api/test', { method: 'POST' });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('allows localhost origin in development', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'development',
    });
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('allows 127.0.0.1 origin in development', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'development',
    });
    const req = new Request('http://127.0.0.1:3000/api/test', {
      method: 'POST',
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });
});

describe('validateCsrfOrigin — NEXTAUTH_URL with port', () => {
  it('allows origin matching NEXTAUTH_URL with port', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://localhost:3000',
      NODE_ENV: 'production',
    });
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { Origin: 'https://localhost:3000' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });
});

describe('validateCsrfOrigin — edge cases', () => {
  it('handles lowercase method', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/test', {
      method: 'post',
      headers: { Origin: 'https://kanishkassalon.com' },
    });
    expect(validateCsrfOrigin(req)).toBeNull();
  });

  it('origin takes precedence over referer', async () => {
    const { validateCsrfOrigin } = await loadModule({
      NEXTAUTH_URL: 'https://kanishkassalon.com',
      NODE_ENV: 'production',
    });
    const req = new Request('https://kanishkassalon.com/api/test', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.com',
        Referer: 'https://kanishkassalon.com/page',
      },
    });
    expect(validateCsrfOrigin(req)).toContain('evil.com');
  });
});
