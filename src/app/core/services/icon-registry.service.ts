import { Injectable, signal, computed, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
    private sanitizer = inject(DomSanitizer);
    private registry = new Map<string, SafeHtml>();

    // Signal para rastrear ícones disponíveis
    readonly availableIcons = signal<string[]>([]);

    register(name: string, svgContent: string): void {
        const safeSvg = this.sanitizer.bypassSecurityTrustHtml(svgContent);
        this.registry.set(name, safeSvg);
        this.availableIcons.update(icons => [...icons, name]);
    }

    get(name: string): SafeHtml | undefined {
        return this.registry.get(name);
    }

    has(name: string): boolean {
        return this.registry.has(name);
    }
}