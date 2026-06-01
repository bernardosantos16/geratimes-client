import {ChangeDetectionStrategy, Component, computed, inject, Input, signal} from '@angular/core';
import {SafeHtml} from '@angular/platform-browser';
import {IconRegistryService} from '@core/services/icon-registry.service';

@Component({
    selector: 'app-svg-icon',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (iconExists()) {
            <span
                    class="icon-wrapper"
                    [innerHTML]="iconHtml()"
                    [style]="styles()"
                    [attr.aria-label]="ariaLabel"
                    role="img">
      </span>
        } @else {
            <span class="icon-wrapper icon-missing" [style]="styles()">⚠️</span>
        }
    `,
    styles: [`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--text2);
        }

        .icon-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        /* ::ng-deep "fura" a encapsulação e alcança o SVG injetado via innerHTML */
        :host ::ng-deep .icon-wrapper svg {
            width: 100%;
            height: 100%;
            fill: currentColor;
        }

        .icon-missing {
            opacity: 0.4;
            font-size: 0.6em;
        }
    `]
})
export class SvgIconComponent {
    @Input() set name(value: string) {
        this.nameSignal.set(value);
    }

    @Input() set color(value: string | undefined) {
        this.colorSignal.set(value);
    }

    @Input() set size(value: string) {
        this.sizeSignal.set(value);
    }

    @Input() ariaLabel = 'Icon';

    private registry = inject(IconRegistryService);

    // Signals internos
    private nameSignal = signal<string>('');
    private colorSignal = signal<string | undefined>(undefined);
    private sizeSignal = signal<string>('24px');

    // Computed signals
    readonly iconExists = computed(() => {
        return this.registry.has(this.nameSignal());
    });

    readonly iconHtml = computed<SafeHtml | null>(() => {
        const name = this.nameSignal();
        return this.registry.get(name) ?? null;
    });

    readonly styles = computed(() => {
        const s: Record<string, string> = {
            width: this.sizeSignal(),
            height: this.sizeSignal(),
        };
        if (this.colorSignal()) {
            s['color'] = this.colorSignal()!;
        }
        return s;
    });

}