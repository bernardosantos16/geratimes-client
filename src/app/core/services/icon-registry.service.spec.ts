import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconRegistryService } from './icon-registry.service';

describe('IconRegistryService', () => {
  let service: IconRegistryService;
  let sanitizerMock: Partial<DomSanitizer>;

  beforeEach(() => {
    sanitizerMock = {
      bypassSecurityTrustHtml: vi.fn((svg: string) => `safe:${svg}` as unknown as SafeHtml),
    };

    TestBed.configureTestingModule({
      providers: [
        IconRegistryService,
        { provide: DomSanitizer, useValue: sanitizerMock },
      ],
    });

    service = TestBed.inject(IconRegistryService);
  });

  it('should start with an empty icon list', () => {
    expect(service.availableIcons()).toEqual([]);
  });

  it('should register an icon and add it to availableIcons signal', () => {
    service.register('home', '<svg>home</svg>');
    expect(service.availableIcons()).toContain('home');
  });

  it('should register multiple icons', () => {
    service.register('home', '<svg>home</svg>');
    service.register('settings', '<svg>settings</svg>');
    service.register('logout', '<svg>logout</svg>');
    expect(service.availableIcons()).toEqual(['home', 'settings', 'logout']);
  });

  it('should return sanitized SVG via get()', () => {
    service.register('home', '<svg>home</svg>');
    const result = service.get('home');
    expect(result).toBe('safe:<svg>home</svg>');
  });

  it('should return undefined via get() for unregistered icon', () => {
    expect(service.get('nonexistent')).toBeUndefined();
  });

  it('should return true via has() for registered icon', () => {
    service.register('dashboard', '<svg>dash</svg>');
    expect(service.has('dashboard')).toBe(true);
  });

  it('should return false via has() for unregistered icon', () => {
    expect(service.has('nonexistent')).toBe(false);
  });

  it('should sanitize SVG content via DomSanitizer when registering', () => {
    service.register('icon', '<svg></svg>');
    expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<svg></svg>');
  });

  it('should allow overwriting an existing icon registration', () => {
    service.register('icon', '<svg>old</svg>');
    service.register('icon', '<svg>new</svg>');
    expect(service.availableIcons()).toEqual(['icon', 'icon']);
    expect(service.get('icon')).toBe('safe:<svg>new</svg>');
  });
});
