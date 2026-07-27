import { describe, it, expect } from 'vitest';
import { fallbackTeamColor } from './team-color.utils';

describe('fallbackTeamColor', () => {
  it('should return first color for index 0', () => {
    expect(fallbackTeamColor(0)).toBe('#1565c0');
  });

  it('should return third color for index 2', () => {
    expect(fallbackTeamColor(2)).toBe('#00a844');
  });

  it('should return last color for index 5', () => {
    expect(fallbackTeamColor(5)).toBe('#7c4dff');
  });

  it('should wrap around using modulo', () => {
    expect(fallbackTeamColor(6)).toBe('#1565c0');
    expect(fallbackTeamColor(7)).toBe('#555555');
  });

  it('should handle large indices', () => {
    expect(fallbackTeamColor(100)).toBe('#f39c12');
    expect(fallbackTeamColor(101)).toBe('#7c4dff');
  });
});
