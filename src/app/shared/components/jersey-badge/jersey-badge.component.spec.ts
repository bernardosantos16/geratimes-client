import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { JerseyBadgeComponent } from './jersey-badge.component';

describe('JerseyBadgeComponent', () => {
  let fixture: ComponentFixture<JerseyBadgeComponent>;
  let component: JerseyBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JerseyBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(JerseyBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render name', () => {
    component.name = 'Neymar';
    fixture.detectChanges();
    const nameEl = fixture.debugElement.query(By.css('.jersey-name'));
    expect(nameEl.nativeElement.textContent.trim()).toBe('Neymar');
  });

  it('should apply hexColor as background', () => {
    component.hexColor = '#ff0000';
    fixture.detectChanges();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.jersey-badge');
    expect(badge.style.background).toBe('rgb(255, 0, 0)');
  });

  it('should show GK tag when isGoalkeeper is true', () => {
    component.isGoalkeeper = true;
    fixture.detectChanges();
    const gkTag = fixture.debugElement.query(By.css('.gk-tag'));
    expect(gkTag.nativeElement.textContent.trim()).toBe('GK');
  });

  it('should not show GK tag when isGoalkeeper is false', () => {
    component.isGoalkeeper = false;
    fixture.detectChanges();
    const gkTag = fixture.debugElement.query(By.css('.gk-tag'));
    expect(gkTag).toBeNull();
  });

  it('should apply contrast text color via pipe', () => {
    component.hexColor = '#000000';
    fixture.detectChanges();
    const nameEl: HTMLElement = fixture.nativeElement.querySelector('.jersey-name');
    expect(nameEl.style.color).toBeTruthy();
  });
});
