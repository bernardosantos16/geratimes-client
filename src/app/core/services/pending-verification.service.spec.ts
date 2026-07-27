import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PendingVerificationService } from './pending-verification.service';

describe('PendingVerificationService', () => {
  let service: PendingVerificationService;

  beforeEach(() => {
    sessionStorage.clear();
    service = new PendingVerificationService();
  });

  describe('setLogin / getLogin', () => {
    it('should store and retrieve login', () => {
      service.setLogin('user@example.com');
      expect(service.getLogin()).toBe('user@example.com');
    });

    it('should return null when no login is stored', () => {
      expect(service.getLogin()).toBeNull();
    });

    it('should overwrite previously stored login', () => {
      service.setLogin('first@example.com');
      service.setLogin('second@example.com');
      expect(service.getLogin()).toBe('second@example.com');
    });
  });

  describe('setToken / getToken', () => {
    it('should store and retrieve token', () => {
      service.setToken('token-abc-123');
      expect(service.getToken()).toBe('token-abc-123');
    });

    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should overwrite previously stored token', () => {
      service.setToken('old-token');
      service.setToken('new-token');
      expect(service.getToken()).toBe('new-token');
    });
  });

  describe('clear', () => {
    it('should remove both login and token', () => {
      service.setLogin('user@example.com');
      service.setToken('token-123');
      service.clear();
      expect(service.getLogin()).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('should be idempotent when called on empty storage', () => {
      expect(() => service.clear()).not.toThrow();
      expect(service.getLogin()).toBeNull();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('maskEmail', () => {
    it('should mask long email addresses', () => {
      const masked = service.maskEmail('john.doe@example.com');
      expect(masked).toMatch(/^jo\*+@e\*+\.com$/);
    });

    it('should mask short local part with single character', () => {
      const masked = service.maskEmail('a@example.com');
      expect(masked).toBe('a*@e****.com');
    });

    it('should mask exactly 2-character local part', () => {
      const masked = service.maskEmail('ab@example.com');
      expect(masked).toBe('a*@e****.com');
    });

    it('should return email unchanged when there is no domain', () => {
      const masked = service.maskEmail('no-at-sign');
      expect(masked).toBe('no-at-sign');
    });

    it('should mask domain name with single character when short', () => {
      const masked = service.maskEmail('user@a.com');
      expect(masked).toMatch(/^us\*+@a\.com$/);
    });

    it('should handle multiple dots in domain', () => {
      const masked = service.maskEmail('user@sub.example.co.uk');
      expect(masked).toMatch(/^us\*+@s\*+\.example\.co\.uk$/);
    });
  });
});
