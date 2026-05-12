import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell" [class.sidebar-open]="sidebarOpen()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <a class="logo" routerLink="/dashboard">FERINO</a>
          <button class="sidebar-close" (click)="sidebarOpen.set(false)" aria-label="Fechar menu">×</button>
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              (click)="sidebarOpen.set(false)">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          @if (auth.currentUser(); as user) {
            <div class="user-chip">
              <div class="user-avatar">{{ user.nickname[0].toUpperCase() }}</div>
              <div class="user-info">
                <span class="user-name">{{ user.nickname }}</span>
                <span class="user-email">{{ user.login }}</span>
              </div>
            </div>
          }
          <div class="sidebar-actions">
            <button class="theme-btn" (click)="themeService.toggle()" [title]="themeService.theme() === 'dark' ? 'Modo claro' : 'Modo escuro'">
              {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
            </button>
            <button class="logout-btn" (click)="logout()">Sair</button>
          </div>
        </div>
      </aside>

      <!-- Overlay for mobile -->
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Main content -->
      <main class="main-content">
        <header class="topbar">
          <button class="hamburger" (click)="sidebarOpen.set(true)" aria-label="Abrir menu">☰</button>
          <a class="topbar-logo" routerLink="/dashboard">FERINO</a>
          <div class="topbar-right">
            <button class="theme-btn" (click)="themeService.toggle()">
              {{ themeService.theme() === 'dark' ? '☀️' : '🌙' }}
            </button>
          </div>
        </header>

        <div class="content-area">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg);
    }

    /* ── Sidebar ─────────────────────────────────── */
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 200;
      transition: transform 0.25s ease;

      @media (max-width: 768px) {
        transform: translateX(-100%);
      }
    }

    .app-shell.sidebar-open .sidebar {
      transform: translateX(0);
    }

    .sidebar-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 199;
      backdrop-filter: blur(2px);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.4rem 1.25rem 1rem;
      border-bottom: 1px solid var(--border);
    }

    .logo {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.6rem;
      letter-spacing: 0.08em;
      color: var(--accent);
      text-decoration: none;
    }

    .sidebar-close {
      display: none;
      background: none; border: none;
      color: var(--text2); font-size: 1.4rem;
      cursor: pointer; padding: 4px;
      @media (max-width: 768px) { display: flex; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      color: var(--text2);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s;

      &:hover { background: var(--surface2); color: var(--text); }
      &.active { background: var(--accent-dim); color: var(--accent);
        .nav-icon { color: var(--accent); }
      }
    }

    .nav-icon { font-size: 1.1rem; width: 20px; text-align: center; }
    .nav-label { }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-chip {
      display: flex; align-items: center; gap: 0.6rem;
    }

    .user-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent-dim);
      border: 1px solid var(--accent);
      color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
      flex-shrink: 0;
    }

    .user-info {
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.85rem; font-weight: 600;
      color: var(--text); white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.72rem; color: var(--text3);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .sidebar-actions {
      display: flex; align-items: center; gap: 0.5rem;
    }

    .theme-btn {
      width: 34px; height: 34px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer; font-size: 0.95rem;
      transition: border-color 0.2s;
      display: flex; align-items: center; justify-content: center;
      &:hover { border-color: var(--accent); }
    }

    .logout-btn {
      flex: 1;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text2);
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { border-color: var(--red); color: var(--red); }
    }

    /* ── Main ────────────────────────────────────── */
    .main-content {
      flex: 1;
      margin-left: 240px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;

      @media (max-width: 768px) {
        margin-left: 0;
      }
    }

    .topbar {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 100;

      @media (max-width: 768px) { display: flex; }
    }

    .hamburger {
      background: none; border: none;
      color: var(--text2); font-size: 1.3rem;
      cursor: pointer; padding: 4px;
    }

    .topbar-logo {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.4rem;
      color: var(--accent);
      letter-spacing: 0.08em;
      text-decoration: none;
    }

    .topbar-right { display: flex; align-items: center; gap: 0.5rem; }

    .content-area {
      flex: 1;
      padding: 2rem 1.5rem;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;

      @media (max-width: 768px) { padding: 1.25rem 1rem; }
    }
  `],
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);

  readonly sidebarOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '⚡', route: '/dashboard', exact: true },
    { label: 'Clubes',    icon: '🏟️', route: '/clubs' },
  ];

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.toast.success('Até logo!'),
      error: () => {},
    });
  }
}
