import {ChangeDetectionStrategy, Component, computed, inject, Input, signal} from '@angular/core';
import {SafeHtml} from '@angular/platform-browser';
import {IconRegistryService} from '@core/services/icon-registry.service';

@Component({
    selector: 'app-svg-icon',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'svg-icon.component.html',
    styleUrls: ['svg-icon.component.scss']
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