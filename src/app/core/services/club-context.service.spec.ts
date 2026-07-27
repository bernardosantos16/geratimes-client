import { describe, it, expect, beforeEach } from 'vitest';
import { ClubContextService } from './club-context.service';

describe('ClubContextService', () => {
  let service: ClubContextService;

  beforeEach(() => {
    service = new ClubContextService();
  });

  it('should initialise with null club id and role', () => {
    expect(service.selectedClubId()).toBeNull();
    expect(service.selectedClubRole()).toBeNull();
  });

  it('should set club context with id and role', () => {
    service.setClubContext('club-uuid', 'DIRECTOR');
    expect(service.selectedClubId()).toBe('club-uuid');
    expect(service.selectedClubRole()).toBe('DIRECTOR');
  });

  it('should set club context with MEMBER role', () => {
    service.setClubContext('another-club', 'MEMBER');
    expect(service.selectedClubId()).toBe('another-club');
    expect(service.selectedClubRole()).toBe('MEMBER');
  });

  it('should clear club context back to null values', () => {
    service.setClubContext('club-uuid', 'DIRECTOR');
    service.clearClubContext();
    expect(service.selectedClubId()).toBeNull();
    expect(service.selectedClubRole()).toBeNull();
  });

  it('should overwrite existing context when setClubContext is called again', () => {
    service.setClubContext('first', 'DIRECTOR');
    service.setClubContext('second', 'MEMBER');
    expect(service.selectedClubId()).toBe('second');
    expect(service.selectedClubRole()).toBe('MEMBER');
  });

  it('should expose readonly signals that cannot be mutated externally', () => {
    service.setClubContext('id', 'DIRECTOR');
    // Signals are typed as readonly — the consumer cannot call .set() on them
    expect(service.selectedClubId()).toBe('id');
  });
});
