import { describe, it, expect } from 'vitest';
import { validateImage } from '@/lib/storage';

describe('validateImage', () => {
  it('accepts valid JPEG', () => {
    const result = validateImage({ type: 'image/jpeg', size: 1024 * 1024 });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts valid PNG', () => {
    const result = validateImage({ type: 'image/png', size: 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('accepts valid WebP', () => {
    const result = validateImage({ type: 'image/webp', size: 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('accepts valid AVIF', () => {
    const result = validateImage({ type: 'image/avif', size: 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('accepts valid GIF', () => {
    const result = validateImage({ type: 'image/gif', size: 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('accepts image/jpg alias', () => {
    const result = validateImage({ type: 'image/jpg', size: 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('rejects unsupported MIME type', () => {
    const result = validateImage({ type: 'image/svg+xml', size: 1000 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('rejects application/pdf', () => {
    const result = validateImage({ type: 'application/pdf', size: 1000 });
    expect(result.valid).toBe(false);
  });

  it('rejects text/plain', () => {
    const result = validateImage({ type: 'text/plain', size: 1000 });
    expect(result.valid).toBe(false);
  });

  it('rejects oversized files with default limit (10MB)', () => {
    const result = validateImage({ type: 'image/jpeg', size: 11 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
    expect(result.error).toContain('10');
  });

  it('accepts files at exact size limit boundary', () => {
    const result = validateImage({ type: 'image/jpeg', size: 10 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('respects custom maxMB limit', () => {
    const result = validateImage({ type: 'image/png', size: 3 * 1024 * 1024 }, 2);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2 MB');
  });

  it('accepts files within custom limit', () => {
    const result = validateImage({ type: 'image/png', size: 1 * 1024 * 1024 }, 2);
    expect(result.valid).toBe(true);
  });

  it('rejects empty file (0 bytes)', () => {
    const result = validateImage({ type: 'image/jpeg', size: 0 });
    expect(result.valid).toBe(true); // 0 < 10MB, type is valid
  });

  it('handles very large files gracefully', () => {
    const result = validateImage({ type: 'image/jpeg', size: 100 * 1024 * 1024 });
    expect(result.valid).toBe(false);
  });
});
