import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'text-red-500');
    expect(result).toBe('px-2 py-1 text-red-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
    expect(result).toBe('base-class conditional-class');
  });

  it('should handle Tailwind conflicts by keeping the last one', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle null and undefined inputs', () => {
    const result = cn('base', null, undefined, 'end');
    expect(result).toBe('base end');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'active': true,
      'inactive': false,
      'visible': true
    });
    expect(result).toBe('active visible');
  });

  it('should merge complex Tailwind classes correctly', () => {
    const result = cn(
      'bg-red-500 text-white p-4',
      'bg-blue-500 m-2',
      'hover:bg-green-500'
    );
    expect(result).toBe('text-white p-4 bg-blue-500 m-2 hover:bg-green-500');
  });
});