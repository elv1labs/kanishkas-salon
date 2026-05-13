import { describe, it, expect } from 'vitest';
import { extractApiError } from '@/lib/extract-error';

describe('extractApiError', () => {
  it('extracts error.message from error object', () => {
    const data = { error: { message: 'Validation failed', code: 'BAD_REQUEST' } };
    expect(extractApiError(data)).toBe('Validation failed');
  });

  it('falls back to error.code when message is absent', () => {
    const data = { error: { code: 'NOT_FOUND' } };
    expect(extractApiError(data)).toBe('NOT_FOUND');
  });

  it('returns the string when error is a plain string', () => {
    const data = { error: 'Something went wrong' };
    expect(extractApiError(data)).toBe('Something went wrong');
  });

  it('returns fallback when data is null', () => {
    expect(extractApiError(null)).toBe('Something went wrong');
  });

  it('returns fallback when data is undefined', () => {
    expect(extractApiError(undefined)).toBe('Something went wrong');
  });

  it('returns fallback when data has no error property', () => {
    const data = { success: false };
    expect(extractApiError(data)).toBe('Something went wrong');
  });

  it('returns fallback when error is null', () => {
    const data = { error: null };
    expect(extractApiError(data)).toBe('Something went wrong');
  });

  it('returns fallback when error is an empty object', () => {
    const data = { error: {} };
    expect(extractApiError(data)).toBe('Something went wrong');
  });

  it('returns custom fallback string', () => {
    expect(extractApiError({}, 'Custom fallback')).toBe('Custom fallback');
  });

  it('handles deeply nested error shapes', () => {
    const data = { error: { message: 'Server error', details: { field: 'email' } } };
    expect(extractApiError(data)).toBe('Server error');
  });

  it('handles empty string error', () => {
    const data = { error: '' };
    expect(extractApiError(data)).toBe('Something went wrong');
  });

  it('handles array error (unexpected shape)', () => {
    const data = { error: ['err1', 'err2'] };
    expect(extractApiError(data)).toBe('Something went wrong');
  });

  it('prefers message over code when both present', () => {
    const data = { error: { message: 'User message', code: 'INTERNAL_ERROR' } };
    expect(extractApiError(data)).toBe('User message');
  });

  it('handles error with numeric code', () => {
    const data = { error: { code: 500 } };
    expect(extractApiError(data)).toBe('Something went wrong');
  });
});
