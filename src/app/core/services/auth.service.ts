import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  LoginRequestDTO, LogoutRequestDTO,
  TokenResponseDTO,
  UserResponseDTO,
} from '../models/api.models';
import { environment } from '../../../environments/environment';

interface AuthState {
  accessToken: string | null;
  user: UserResponseDTO | null;
  expiresAt: number | null;
}

const STORAGE_KEY = 'ferino_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  // ── Signals ──────────────────────────────────────────────────────────────
  private readonly _state = signal<AuthState>(this.loadFromStorage());

  readonly isAuthenticated = computed(() => {
    const state = this._state();
    if (!state.accessToken || !state.expiresAt) return false;
    return Date.now() < state.expiresAt;
  });

  readonly currentUser = computed(() => this._state().user);
  readonly accessToken = computed(() => this._state().accessToken);

  // ── Public API ────────────────────────────────────────────────────────────
  login(dto: LoginRequestDTO): Observable<TokenResponseDTO> {
    return this.http.post<TokenResponseDTO>(`${this.baseUrl}/login`, dto).pipe(
      tap((res) => this.persistSession(res)),
      catchError((err) => throwError(() => err))
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const dto: LogoutRequestDTO = { refreshToken: refreshToken ?? '' };

    return this.http.post<void>(`${this.baseUrl}/logout`, dto).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  refresh(): Observable<TokenResponseDTO> {
    return this.http
      .post<TokenResponseDTO>(`${this.baseUrl}/refresh`, {})
  }

  setUser(user: UserResponseDTO): void {
    this._state.update((s) => ({ ...s, user }));
    this.saveToStorage();
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private persistSession(token: TokenResponseDTO): void {
    const expiresAt = Date.now() + token.expiresInSeconds * 1000;
    this._state.set({
      accessToken: token.accessToken,
      user: this._state().user,
      expiresAt,
    });
    this.saveToStorage();
  }

  private clearSession(): void {
    this._state.set({ accessToken: null, user: null, expiresAt: null });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('ferino_refresh');
    this.router.navigate(['/auth/login']);
  }

  private saveToStorage(): void {
    const state = this._state();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private loadFromStorage(): AuthState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { accessToken: null, user: null, expiresAt: null };
      return JSON.parse(raw) as AuthState;
    } catch {
      return { accessToken: null, user: null, expiresAt: null };
    }
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('ferino_refresh');
  }
}
