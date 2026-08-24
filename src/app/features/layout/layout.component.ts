import {Component, inject, signal, ChangeDetectionStrategy, DestroyRef} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import { timer, switchMap, catchError, of } from 'rxjs';
import {AuthService} from '@core/services/auth.service';
import {ThemeService} from '@core/services/theme.service';
import {ToastService} from '@core/services/toast.service';
import {NotificationsService} from '@core/services/notifications.service';
import {SvgIconComponent} from "@shared/components/svg-icon/svg-icon.component";

interface NavItem {
    label: string;
    icon: string;
    route: string;
    exact?: boolean;
}

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterModule, CommonModule, SvgIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: 'layout.component.html',
    styleUrls: ['layout.component.scss'],
})
export class LayoutComponent {
    protected readonly auth = inject(AuthService);
    protected readonly themeService = inject(ThemeService);
    private readonly toast = inject(ToastService);
    private readonly notificationsService = inject(NotificationsService);
    private readonly destroyRef = inject(DestroyRef);

    readonly sidebarOpen = signal(false);
    readonly unreadCount = signal(0);

    readonly navItems: NavItem[] = [
        {label: 'Dashboard', icon: 'dashboard', route: '/dashboard', exact: true},
        {label: 'Clubes', icon: 'stadium', route: '/clubs'},
        {label: 'Notificações', icon: 'notifications', route: '/notifications'},
    ];

    constructor() {
        timer(0, 60_000).pipe(
            switchMap(() =>
                this.notificationsService.list(true, { size: 1 }).pipe(
                    catchError(() => of(null))
                )
            ),
            takeUntilDestroyed()
        ).subscribe((page) => {
            this.unreadCount.set(page?.totalElements ?? 0);
        });
    }

    logout(): void {
        this.auth.logout().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => this.toast.success('Até logo!'),
            error: (err: unknown) => this.toast.warning('Dados locais foram limpos.'),
        });
    }
}
