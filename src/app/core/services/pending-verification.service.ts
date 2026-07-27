import { Injectable } from '@angular/core';

const STORAGE_KEY = 'ferino:pendingVerificationLogin';
const TOKEN_KEY = 'ferino:pendingVerificationToken';

@Injectable({ providedIn: 'root' })
export class PendingVerificationService {
  setLogin(login: string): void {
    sessionStorage.setItem(STORAGE_KEY, login);
  }

  getLogin(): string | null {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;

    const maskedLocal = local.length <= 2
      ? local[0] + '*'
      : local.slice(0, 2) + '*'.repeat(Math.min(local.length - 2, 5));

    const domainParts = domain.split('.');
    const domainName = domainParts[0] || '';
    const tld = domainParts.slice(1).join('.');

    const maskedDomain = domainName.length <= 2
      ? domainName
      : domainName.slice(0, 1) + '*'.repeat(Math.min(domainName.length - 1, 4));

    return `${maskedLocal}@${maskedDomain}${tld ? '.' + tld : ''}`;
  }
}
