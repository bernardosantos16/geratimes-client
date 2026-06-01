import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, tap, catchError, of } from 'rxjs';
import {
  LoginRequestDTO,
  TokenResponseDTO,
  UserResponseDTO,
} from '../models/api.models';
import { environment } from '../../../environments/environment';
import { ClubContextService } from './club-context.service';

interface AuthState {
  accessToken: string | null;
  user: UserResponseDTO | null;
}

// Só o usuário vai para storage — token fica em memória
const STORAGE_KEY = 'ferino_user';
const TOKEN_EXPIRY_SKEW_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly clubContextService = inject(ClubContextService);
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  // ── Estado de refresh (usado pelo interceptor) ────────────────────────────
  isRefreshing = false;
  logoutStarted = false;
  refreshTokenSubject = new ReplaySubject<string>(1);

  // ── Signals ───────────────────────────────────────────────────────────────
  private readonly _state = signal<AuthState>(this.loadFromStorage());

  readonly isAuthenticated = computed(() => {
    const token = this._state().accessToken;
    return !!token && !this.isTokenExpired(token);
  });

  readonly currentUser = computed(() => this._state().user);
  readonly accessToken = computed(() => this._state().accessToken);

  // ── Public API ────────────────────────────────────────────────────────────
  login(dto: LoginRequestDTO): Observable<TokenResponseDTO> {
    return this.http
        .post<TokenResponseDTO>(`${this.baseUrl}/login`, dto, { withCredentials: true })
        .pipe(tap((res) => this.persistSession(res)));
  }

  logout(): Observable<void> {
    return this.http
        .post<void>(`${this.baseUrl}/logout`, null, { withCredentials: true })
        .pipe(
            catchError(() => of(void 0)),
            tap(() => this.clearSession())
        );
  }

  refreshToken(): Observable<TokenResponseDTO> {
    return this.http
        .post<TokenResponseDTO>(`${this.baseUrl}/refresh`, null, { withCredentials: true })
        .pipe(tap((res) => this.persistSession(res)));
  }

  setUser(user: UserResponseDTO): void {
    this._state.update((s) => ({ ...s, user }));
    this.saveToStorage();
  }

  isTokenExpired(token: string): boolean {
    const expiresAt = this.getTokenExpirationMs(token);
    if (!expiresAt) return true;
    return Date.now() >= expiresAt - TOKEN_EXPIRY_SKEW_MS;
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private persistSession(res: TokenResponseDTO): void {
    this._state.update((s) => ({ ...s, accessToken: res.accessToken }));
    // Não salva o token — só o usuário persiste no storage
  }

  private clearSession(): void {
    this._state.set({ accessToken: null, user: null });
    this.clubContextService.clearClubContext();
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/auth/login']);
  }

  private saveToStorage(): void {
    const user = this._state().user;
    // Salva só o usuário, nunca o token
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
  }

  private loadFromStorage(): AuthState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { accessToken: null, user: null };
      const parsed = JSON.parse(raw) as { user?: UserResponseDTO };
      return { accessToken: null, user: parsed.user ?? null };
    } catch {
      return { accessToken: null, user: null };
    }
  }

  private getTokenExpirationMs(token: string): number | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;
      const normalized = payload
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(payload.length / 4) * 4, '=');
      const claims = JSON.parse(atob(normalized)) as { exp?: number };
      return typeof claims.exp === 'number' ? claims.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
