import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  readonly isTouchDevice = signal(this.detectTouch());

  constructor() {
    if (this.isTouchDevice()) {
      document.documentElement.classList.add('touch-device');
    }
  }

  private detectTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
