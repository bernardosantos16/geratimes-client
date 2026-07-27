import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService, ToastMessage } from '@core/services/toast.service';

function makeToast(overrides: Partial<ToastMessage> = {}): ToastMessage {
  return {
    id: 't1',
    type: 'success',
    message: 'Sucesso!',
    ...overrides,
  };
}

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let component: ToastContainerComponent;
  let mockToasts: ReturnType<typeof signal<ToastMessage[]>>;
  let toastService: Pick<ToastService, 'toasts' | 'dismiss'>;

  beforeEach(async () => {
    mockToasts = signal<ToastMessage[]>([]);
    toastService = {
      toasts: mockToasts.asReadonly(),
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [{ provide: ToastService, useValue: toastService }],
    }).compileComponents();
    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
  });

  it('should render toasts from service', () => {
    mockToasts.set([makeToast(), makeToast({ id: 't2', message: 'Outro' })]);
    fixture.detectChanges();

    const toasts = fixture.debugElement.queryAll(By.css('.toast'));
    expect(toasts.length).toBe(2);
  });

  it('should show correct icon per type', () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    for (const [type, icon] of Object.entries(icons)) {
      mockToasts.set([makeToast({ type: type as ToastMessage['type'] })]);
      fixture.detectChanges();

      const iconEl = fixture.debugElement.query(By.css('.toast-icon'));
      expect(iconEl.nativeElement.textContent).toBe(icon);
    }
  });

  it('should show toast message text', () => {
    mockToasts.set([makeToast({ message: 'Operação concluída' })]);
    fixture.detectChanges();

    const msg = fixture.debugElement.query(By.css('.toast-msg'));
    expect(msg.nativeElement.textContent.trim()).toBe('Operação concluída');
  });

  it('should dismiss toast on close button click', () => {
    mockToasts.set([makeToast()]);
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.toast-close'));
    closeBtn.triggerEventHandler('click', null);

    expect(toastService.dismiss).toHaveBeenCalledWith('t1');
  });

  it('should have aria-live polite on container', () => {
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css('.toast-container'));
    expect(container.attributes['aria-live']).toBe('polite');
  });
});
