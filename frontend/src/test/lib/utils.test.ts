import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves tailwind conflicts (later wins)', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('removes falsy values', () => {
    const isBarActive = false;
    expect(cn('foo', isBarActive && 'bar', undefined, null, 'baz')).toBe('foo baz');
  });

  it('handles conditional object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });
});
