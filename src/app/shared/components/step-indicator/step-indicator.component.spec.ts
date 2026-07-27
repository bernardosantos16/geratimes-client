import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StepIndicatorComponent, StepIndicatorStep } from './step-indicator.component';

describe('StepIndicatorComponent', () => {
  let fixture: ComponentFixture<StepIndicatorComponent>;
  let component: StepIndicatorComponent;

  const steps: StepIndicatorStep[] = [
    { key: 'players', label: 'Jogadores' },
    { key: 'config', label: 'Configurar' },
    { key: 'result', label: 'Times' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepIndicatorComponent);
    component = fixture.componentInstance;
    component.steps = steps;
  });

  it('should render all step labels and numbers', () => {
    component.currentStep = 'players';
    fixture.detectChanges();

    const stepLabels = fixture.debugElement.queryAll(By.css('.step-label'));
    expect(stepLabels).toHaveLength(3);
    expect(stepLabels[0].nativeElement.textContent.trim()).toBe('Jogadores');
    expect(stepLabels[1].nativeElement.textContent.trim()).toBe('Configurar');
    expect(stepLabels[2].nativeElement.textContent.trim()).toBe('Times');
  });

  it('should mark the current step as active', () => {
    component.currentStep = 'config';
    fixture.detectChanges();

    const steps = fixture.debugElement.queryAll(By.css('.step'));
    expect(steps[1].classes['active']).toBe(true);
  });

  it('should render checkmark for done steps', () => {
    component.currentStep = 'result';
    fixture.detectChanges();

    const nums = fixture.debugElement.queryAll(By.css('.step-num'));
    expect(nums[0].nativeElement.textContent.trim()).toBe('✓');
    expect(nums[1].nativeElement.textContent.trim()).toBe('✓');
    expect(nums[2].nativeElement.textContent.trim()).toBe('3');
  });

  it('should render connector elements between steps', () => {
    component.currentStep = 'players';
    fixture.detectChanges();

    const connectors = fixture.debugElement.queryAll(By.css('.step-connector'));
    expect(connectors).toHaveLength(2);
  });

  it('should mark connectors as done for completed steps', () => {
    component.currentStep = 'result';
    fixture.detectChanges();

    const connectors = fixture.debugElement.queryAll(By.css('.step-connector'));
    expect(connectors[0].classes['done']).toBe(true);
    expect(connectors[1].classes['done']).toBe(true);
  });

  it('should handle single step without connectors', () => {
    component.steps = [{ key: 'only', label: 'Único' }];
    component.currentStep = 'only';
    fixture.detectChanges();

    const connectors = fixture.debugElement.queryAll(By.css('.step-connector'));
    expect(connectors).toHaveLength(0);
  });
});
