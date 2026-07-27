import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('should default to dark theme when OS prefers dark', () => {
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('dark');
  });

  it('should default to light theme when OS prefers light', () => {
    (window.matchMedia as any).mockReturnValue({ matches: true, media: '', addEventListener: vi.fn(), removeEventListener: vi.fn() });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('light');
  });

  it('should load theme from localStorage if previously saved', () => {
    localStorage.setItem('ferino_theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('light');
  });

  it('should ignore invalid localStorage values and fall back to OS preference', () => {
    localStorage.setItem('ferino_theme', 'invalid');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    localStorage.setItem('ferino_theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    s.toggle();
    expect(s.theme()).toBe('light');
  });

  it('should toggle from light to dark', () => {
    localStorage.setItem('ferino_theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const s = TestBed.inject(ThemeService);
    s.toggle();
    expect(s.theme()).toBe('dark');
  });
});
