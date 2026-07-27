import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SafeHtml } from '@angular/platform-browser';
import { SvgIconComponent } from './svg-icon.component';
import { IconRegistryService } from '@core/services/icon-registry.service';

const SAFE_SVG: SafeHtml = '<svg>icon</svg>' as unknown as SafeHtml;

describe('SvgIconComponent', () => {
  let fixture: ComponentFixture<SvgIconComponent>;
  let component: SvgIconComponent;
  let mockRegistry: { has: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockRegistry = {
      has: vi.fn().mockReturnValue(false),
      get: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [SvgIconComponent],
      providers: [{ provide: IconRegistryService, useValue: mockRegistry }],
    }).compileComponents();
    fixture = TestBed.createComponent(SvgIconComponent);
    component = fixture.componentInstance;
  });

  it('should render SVG when icon exists in registry', () => {
    mockRegistry.has.mockReturnValue(true);
    mockRegistry.get.mockReturnValue(SAFE_SVG);
    component.name = 'home';
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.icon-wrapper'));
    expect(wrapper).toBeTruthy();
    expect(wrapper.nativeElement.textContent).toContain('icon');
  });

  it('should show warning fallback when icon does not exist', () => {
    mockRegistry.has.mockReturnValue(false);
    component.name = 'unknown';
    fixture.detectChanges();

    const missing = fixture.debugElement.query(By.css('.icon-missing'));
    expect(missing).toBeTruthy();
    expect(missing.nativeElement.textContent).toContain('⚠');
  });

  it('should apply custom size styles', () => {
    mockRegistry.has.mockReturnValue(true);
    mockRegistry.get.mockReturnValue(SAFE_SVG);
    component.name = 'home';
    component.size = '48px';
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.icon-wrapper');
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
  });

  it('should apply custom color when provided', () => {
    mockRegistry.has.mockReturnValue(true);
    mockRegistry.get.mockReturnValue(SAFE_SVG);
    component.name = 'home';
    component.color = 'var(--red)';
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.icon-wrapper');
    expect(wrapper.style.color).toBe('var(--red)');
  });

  it('should default size to 24px', () => {
    mockRegistry.has.mockReturnValue(false);
    component.name = 'home';
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.icon-wrapper');
    expect(wrapper.style.width).toBe('24px');
    expect(wrapper.style.height).toBe('24px');
  });

  it('should apply aria-label attribute', () => {
    mockRegistry.has.mockReturnValue(true);
    mockRegistry.get.mockReturnValue(SAFE_SVG);
    component.name = 'home';
    component.ariaLabel = 'Ícone de início';
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.icon-wrapper'));
    expect(wrapper.attributes['aria-label']).toBe('Ícone de início');
  });
});
