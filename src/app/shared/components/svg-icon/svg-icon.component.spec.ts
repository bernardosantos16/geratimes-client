import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SvgIconComponent } from './svg-icon.component';
import { IconRegistryService } from '@core/services/icon-registry.service';

describe('SvgIconComponent', () => {
  let fixture: ComponentFixture<SvgIconComponent>;
  let component: SvgIconComponent;
  let mockRegistry: any;
  let safeSvg: SafeHtml;

  beforeEach(async () => {
    mockRegistry = {
      has: () => false,
      get: () => null,
    };

    await TestBed.configureTestingModule({
      imports: [SvgIconComponent],
      providers: [{ provide: IconRegistryService, useValue: mockRegistry }],
    }).compileComponents();

    const sanitizer = TestBed.inject(DomSanitizer);
    safeSvg = sanitizer.bypassSecurityTrustHtml('<svg>icon</svg>');

    fixture = TestBed.createComponent(SvgIconComponent);
    component = fixture.componentInstance;
  });

  it('should render SVG when icon exists in registry', () => {
    mockRegistry.has = () => true;
    mockRegistry.get = () => safeSvg;
    component.name = 'home';
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.icon-wrapper'));
    expect(wrapper).toBeTruthy();
    expect(wrapper.nativeElement.textContent).toContain('icon');
  });

  it('should show warning fallback when icon does not exist', () => {
    mockRegistry.has = () => false;
    component.name = 'unknown';
    fixture.detectChanges();

    const missing = fixture.debugElement.query(By.css('.icon-missing'));
    expect(missing).toBeTruthy();
    expect(missing.nativeElement.textContent).toContain('⚠');
  });

  it('should apply custom size styles', () => {
    mockRegistry.has = () => true;
    mockRegistry.get = () => safeSvg;
    component.name = 'home';
    component.size = '48px';
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.icon-wrapper');
    expect(wrapper.style.width).toBe('48px');
    expect(wrapper.style.height).toBe('48px');
  });

  it('should apply custom color when provided', () => {
    mockRegistry.has = () => true;
    mockRegistry.get = () => safeSvg;
    component.name = 'home';
    component.color = 'var(--red)';
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.icon-wrapper');
    expect(wrapper.style.color).toBe('var(--red)');
  });

  it('should default size to 24px', () => {
    mockRegistry.has = () => false;
    component.name = 'home';
    fixture.detectChanges();

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.icon-wrapper');
    expect(wrapper.style.width).toBe('24px');
    expect(wrapper.style.height).toBe('24px');
  });

  it('should apply aria-label attribute', () => {
    mockRegistry.has = () => true;
    mockRegistry.get = () => safeSvg;
    component.name = 'home';
    component.ariaLabel = 'Ícone de início';
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.icon-wrapper'));
    expect(wrapper.attributes['aria-label']).toBe('Ícone de início');
  });
});
