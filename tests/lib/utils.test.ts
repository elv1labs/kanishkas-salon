import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('merges Tailwind classes with conflicts resolved', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('px-4', undefined, null, 'py-2')).toBe('px-4 py-2');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('resolves padding conflicts correctly', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('merges multiple conditional groups', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn(
      'btn',
      isActive && 'btn-active',
      isDisabled && 'btn-disabled',
      'btn-primary',
    )).toBe('btn btn-active btn-primary');
  });

  it('handles array arguments', () => {
    expect(cn(['px-4', 'py-2'], 'mx-auto')).toBe('px-4 py-2 mx-auto');
  });

  it('handles object arguments', () => {
    expect(cn({ 'text-red': true, 'text-blue': false })).toBe('text-red');
  });

  it('merges conflicting color utilities', () => {
    expect(cn(
      'text-red-500 font-bold',
      'text-blue-500',
    )).toBe('font-bold text-blue-500');
  });

  it('preserves non-conflicting utilities', () => {
    expect(cn('text-lg', 'font-bold')).toBe('text-lg font-bold');
  });
});
