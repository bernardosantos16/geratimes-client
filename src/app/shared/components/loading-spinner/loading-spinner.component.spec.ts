import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let fixture: ComponentFixture<LoadingSpinnerComponent>;
  let component: LoadingSpinnerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
  });

  it('should render spinner with default size 32px', () => {
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.spinner'));
    expect(spinner.styles['width']).toBe('32px');
    expect(spinner.styles['height']).toBe('32px');
  });

  it('should render spinner with custom size', () => {
    component.size = 48;
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.spinner'));
    expect(spinner.styles['width']).toBe('48px');
    expect(spinner.styles['height']).toBe('48px');
  });

  it('should show label when provided', () => {
    component.label = 'Carregando dados...';
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('.label'));
    expect(label.nativeElement.textContent.trim()).toBe('Carregando dados...');
  });

  it('should hide label when empty', () => {
    component.label = '';
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('.label'));
    expect(label).toBeNull();
  });

  it('should apply overlay class when overlay is true', () => {
    component.overlay = true;
    fixture.detectChanges();
    const wrap = fixture.debugElement.query(By.css('.spinner-wrap'));
    expect(wrap.classes['overlay']).toBe(true);
  });
});
