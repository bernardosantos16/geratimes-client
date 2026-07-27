import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ClubsService } from './clubs.service';
import {
  ClubResponseDTO, ClubMemberResponseDTO, ClubJerseyResponseDTO,
  PageClubMemberResponseDTO,
} from '../models/api.models';
import { HttpParams } from '@angular/common/http';

describe('ClubsService', () => {
  let service: ClubsService;
  let httpTesting: HttpTestingController;
  const base = 'https://gerenciador-ferino.up.railway.app/api/clubs';
  const club: ClubResponseDTO = { id: 'c1', name: 'Ferino FC', nickname: 'ferino' };
  const member: ClubMemberResponseDTO = { id: 1, name: 'Player 1', clubRole: 'MEMBER' };
  const jersey: ClubJerseyResponseDTO = { id: 10, name: 'Home', hexColor: '#4dff8f', isGoalkeeperJersey: false, clubId: 'c1' };
  const emptyPage: PageClubMemberResponseDTO = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 100, first: true, last: true, empty: true, numberOfElements: 0 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClubsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClubsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpTesting.verify(); });

  // ── Clubs ──

  it('should fetch clubs filtered by role via GET', () => {
    service.getClubs('DIRECTOR').subscribe((res) => expect(res).toEqual([club]));
    const req = httpTesting.expectOne((r) => r.url === base && r.params.get('clubRole') === 'DIRECTOR');
    expect(req.request.method).toBe('GET');
    req.flush([club]);
  });

  it('should fetch clubs without role filter via GET', () => {
    service.getClubs().subscribe();
    const req = httpTesting.expectOne(base);
    expect(req.request.params.has('clubRole')).toBe(false);
    req.flush([]);
  });

  it('should fetch club by id via GET', () => {
    service.getClubById('c1').subscribe();
    const req = httpTesting.expectOne(`${base}/c1`);
    expect(req.request.method).toBe('GET');
    req.flush(club);
  });

  it('should fetch club by nickname via GET', () => {
    service.getClubByNickname('ferino').subscribe();
    const req = httpTesting.expectOne(`${base}/nickname/ferino`);
    req.flush(club);
  });

  it('should create club via POST', () => {
    service.createClub({ name: 'New FC' }).subscribe();
    const req = httpTesting.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ ...club, name: 'New FC' });
  });

  it('should update club via PUT', () => {
    service.updateClub('c1', { name: 'Updated' }).subscribe();
    const req = httpTesting.expectOne(`${base}/c1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Updated');
    req.flush({ ...club, name: 'Updated' });
  });

  it('should delete club via DELETE', () => {
    service.deleteClub('c1').subscribe();
    const req = httpTesting.expectOne(`${base}/c1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Members ──

  it('should fetch members with pagination via GET', () => {
    service.getMembers('c1', { page: 0, size: 50 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === `${base}/c1/members` && r.params.get('page') === '0');
    expect(req.request.params.get('size')).toBe('50');
    req.flush(emptyPage);
  });

  it('should add member via POST', () => {
    service.addMember('c1', { name: 'New Player' }).subscribe();
    const req = httpTesting.expectOne(`${base}/c1/members`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...member, name: 'New Player' });
  });

  it('should update member via PATCH', () => {
    service.updateMember('c1', 1, { rating: 5 }).subscribe();
    const req = httpTesting.expectOne(`${base}/c1/members/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.rating).toBe(5);
    req.flush({ ...member, rating: 5 });
  });

  it('should remove member via DELETE', () => {
    service.removeMember('c1', 1).subscribe();
    const req = httpTesting.expectOne(`${base}/c1/members/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ── Jerseys ──

  it('should fetch jerseys via GET', () => {
    service.getJerseys('c1').subscribe();
    const req = httpTesting.expectOne(`${base}/c1/jerseys`);
    req.flush([jersey]);
  });

  it('should add jersey via POST', () => {
    service.addJersey('c1', { name: 'Away', hexColor: '#1565c0', isGoalkeeperJersey: false }).subscribe();
    const req = httpTesting.expectOne(`${base}/c1/jerseys`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...jersey, name: 'Away' });
  });

  it('should update jersey via PUT', () => {
    service.updateJersey('c1', 10, { name: 'Third' }).subscribe();
    const req = httpTesting.expectOne(`${base}/c1/jerseys/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Third');
    req.flush({ ...jersey, name: 'Third' });
  });

  it('should delete jersey via DELETE', () => {
    service.deleteJersey('c1', 10).subscribe();
    const req = httpTesting.expectOne(`${base}/c1/jerseys/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
