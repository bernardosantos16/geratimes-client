import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '@shared/components/toast-container/toast-container.component';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
  `],
})
export class AppComponent implements OnInit {
  // Inject ThemeService so it initialises the data-theme attribute on startup
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    // ThemeService constructor already applies the saved theme via effect()
  }
}
