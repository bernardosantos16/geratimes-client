import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
  });

  it('should be hidden by default', () => {
    fixture.detectChanges();
    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).toBeNull();
  });

  it('should show dialog when open() is called', () => {
    component.open();
    fixture.detectChanges();
    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).toBeTruthy();
  });

  it('should hide when close() is called', () => {
    component.open();
    fixture.detectChanges();
    component.close();
    fixture.detectChanges();
    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).toBeNull();
  });

  it('should emit confirmed and close on confirm button click', () => {
    const spy = vi.fn();
    component.confirmed.subscribe(spy);
    component.open();
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.btn-confirm'));
    btn.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
    expect(component.visible()).toBe(false);
  });

  it('should emit cancelled and close on cancel button click', () => {
    const spy = vi.fn();
    component.cancelled.subscribe(spy);
    component.open();
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.btn-cancel'));
    btn.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
    expect(component.visible()).toBe(false);
  });

  it('should close on backdrop click', () => {
    component.open();
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    backdrop.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.visible()).toBe(false);
  });

  it('should apply danger class to confirm button', () => {
    component.danger = true;
    component.open();
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.btn-confirm'));
    expect(btn.classes['danger']).toBe(true);
  });
});
