import { describe, it, expect, afterEach } from 'vitest';
import { DeviceService } from './device.service';

describe('DeviceService', () => {
  afterEach(() => {
    document.documentElement.classList.remove('touch-device');
    delete (window as Record<string, unknown>)['ontouchstart'];
  });

  it('should detect touch device when ontouchstart exists', () => {
    (window as Record<string, unknown>)['ontouchstart'] = vi.fn();
    const service = new DeviceService();
    expect(service.isTouchDevice()).toBe(true);
  });

  it('should detect non-touch device without ontouchstart', () => {
    delete (window as Record<string, unknown>)['ontouchstart'];
    const service = new DeviceService();
    expect(service.isTouchDevice()).toBe(false);
  });

  it('should add touch-device class to html element when touch is detected', () => {
    (window as Record<string, unknown>)['ontouchstart'] = vi.fn();
    new DeviceService();
    expect(document.documentElement.classList.contains('touch-device')).toBe(true);
  });

  it('should not add touch-device class when no touch support', () => {
    delete (window as Record<string, unknown>)['ontouchstart'];
    new DeviceService();
    expect(document.documentElement.classList.contains('touch-device')).toBe(false);
  });
});
