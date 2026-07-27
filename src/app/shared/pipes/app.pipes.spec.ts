import { describe, it, expect } from 'vitest';
import { MatchDatePipe, ClubRolePipe, MatchPositionPipe, ContrastPipe } from './app.pipes';

describe('MatchDatePipe', () => {
  const pipe = new MatchDatePipe();
  const dateStr = '2025-06-15T14:30:00Z';

  it('should return em-dash for null input', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return em-dash for undefined input', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('should return em-dash for empty string', () => {
    expect(pipe.transform('')).toBe('—');
  });

  it('should return em-dash for invalid date string', () => {
    expect(pipe.transform('not-a-date')).toBe('—');
  });

  it('should format date in short format by default (dd/MM/yyyy HH:mm)', () => {
    const result = pipe.transform(dateStr);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('should format date in short format explicitly', () => {
    const result = pipe.transform(dateStr, 'short');
    expect(result).toContain('/');
    expect(result).toContain(':');
  });

  it('should format date in long format with weekday', () => {
    const result = pipe.transform(dateStr, 'long');
    expect(result).toMatch(/domingo|segunda|terça|quarta|quinta|sexta|sábado/i);
    expect(result).toContain('junho');
  });

  it('should format time only in time format', () => {
    const result = pipe.transform(dateStr, 'time');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    expect(result).not.toContain('/');
  });

  it('should cache Intl.DateTimeFormat instances for the same format', () => {
    // Verifying that repeated calls don't error — cache is internal
    const r1 = pipe.transform(dateStr, 'short');
    const r2 = pipe.transform(dateStr, 'short');
    expect(r1).toBe(r2);
  });
});

describe('ClubRolePipe', () => {
  const pipe = new ClubRolePipe();

  it('should return "Diretor" for DIRECTOR', () => {
    expect(pipe.transform('DIRECTOR')).toBe('Diretor');
  });

  it('should return "Membro" for MEMBER', () => {
    expect(pipe.transform('MEMBER')).toBe('Membro');
  });

  it('should return em-dash for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return em-dash for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('should return em-dash for unknown value', () => {
    expect(pipe.transform('UNKNOWN' as any)).toBe('—');
  });
});

describe('MatchPositionPipe', () => {
  const pipe = new MatchPositionPipe();

  it('should return "Linha" for LINE', () => {
    expect(pipe.transform('LINE')).toBe('Linha');
  });

  it('should return "Goleiro" for GOAL', () => {
    expect(pipe.transform('GOAL')).toBe('Goleiro');
  });

  it('should return em-dash for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return em-dash for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });
});

describe('ContrastPipe', () => {
  const pipe = new ContrastPipe();

  it('should return black for light colors', () => {
    expect(pipe.transform('#ffffff')).toBe('#000000');
    expect(pipe.transform('#f0f0f8')).toBe('#000000');
    expect(pipe.transform('#ffd94d')).toBe('#000000');
  });

  it('should return white for dark colors', () => {
    expect(pipe.transform('#000000')).toBe('#ffffff');
    expect(pipe.transform('#111118')).toBe('#ffffff');
    expect(pipe.transform('#1565c0')).toBe('#ffffff');
  });

  it('should return black when no hexColor is provided', () => {
    expect(pipe.transform()).toBe('#000000');
    expect(pipe.transform('')).toBe('#000000');
  });

  it('should handle hex colors without leading hash', () => {
    expect(pipe.transform('ffffff')).toBe('#000000');
  });

  it('should return black for invalid hex length', () => {
    expect(pipe.transform('#12345')).toBe('#000000');
    expect(pipe.transform('#1234567')).toBe('#000000');
  });

  it('should cache results for the same color', () => {
    const r1 = pipe.transform('#4dff8f');
    const r2 = pipe.transform('#4dff8f');
    expect(r1).toBe(r2);
  });
});
