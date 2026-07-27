import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestScheduler } from 'rxjs/testing';
import { ToastService, ToastType } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    service = new ToastService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the service with an empty toast queue', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast to the queue when show() is called', () => {
    service.show('Test message', 'info');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].id).toBeTruthy();
  });

  it('should support all toast types via show()', () => {
    const types: ToastType[] = ['success', 'error', 'info', 'warning'];
    for (const type of types) {
      service.show(`msg-${type}`, type);
    }
    expect(service.toasts()).toHaveLength(4);
    expect(service.toasts().map(t => t.type)).toEqual(types);
  });

  it('should dismiss a toast by id', () => {
    service.show('msg1');
    service.show('msg2');
    const idToRemove = service.toasts()[0].id;
    service.dismiss(idToRemove);
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].message).toBe('msg2');
  });

  it('should auto-dismiss a toast after the configured duration', () => {
    service.show('auto-dismiss', 'info', 100);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should not auto-dismiss when duration is 0', () => {
    service.show('sticky', 'warning', 0);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(10_000);
    expect(service.toasts()).toHaveLength(1);
  });

  it('should clear the timer when a toast is dismissed manually before auto-dismiss', () => {
    service.show('early-dismiss', 'info', 5000);
    const id = service.toasts()[0].id;
    service.dismiss(id);
    vi.advanceTimersByTime(5000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should not leak timers after manual dismiss of an auto-dismiss toast', () => {
    service.show('clean-timer', 'info', 5000);
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
    vi.advanceTimersByTime(5000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('success() helper should create a success toast with default duration', () => {
    service.success('operation ok');
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('operation ok');
  });

  it('error() helper should create an error toast with 6-second duration', () => {
    service.error('something failed');
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].message).toBe('something failed');
    vi.advanceTimersByTime(4000);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(service.toasts()).toHaveLength(0);
  });

  it('info() helper should create an info toast', () => {
    service.info('for your information');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('warning() helper should create a warning toast', () => {
    service.warning('be careful');
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should generate unique IDs for each toast', () => {
    service.show('a');
    service.show('b');
    const ids = service.toasts().map(t => t.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('should not mutate the previous toast array when adding a toast', () => {
    service.show('first');
    const firstArray = service.toasts();
    service.show('second');
    expect(firstArray).not.toBe(service.toasts());
  });
});
