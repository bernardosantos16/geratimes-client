import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatchesService } from './matches.service';
import { CreateMatchRequestDTO, BatchMatchRequestDTO, SetMatchResultRequestDTO, PageMatchResponseDTO, MatchResponseDTO, MatchParticipantResponseDTO } from '../models/api.models';

describe('MatchesService', () => {
  let service: MatchesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MatchesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MatchesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const match: MatchResponseDTO = { id: 'm1', clubId: 'c1', dateTime: '2025-06-15T14:00:00Z' };

  it('should create a match via POST', () => {
    const dto: CreateMatchRequestDTO = { clubId: 'c1', dateTime: '2025-06-15T14:00:00Z' };
    service.createMatch(dto).subscribe((res) => {
      expect(res).toEqual(match);
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}`);
    expect(req.request.method).toBe('POST');
    req.flush(match);
  });

  it('should fetch a match by id via GET', () => {
    service.getMatch('m1').subscribe((res) => {
      expect(res.id).toBe('m1');
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}/m1`);
    expect(req.request.method).toBe('GET');
    req.flush(match);
  });

  it('should fetch matches with pagination params', () => {
    const page: PageMatchResponseDTO = {
      content: [match],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 15,
      first: true,
      last: true,
      empty: false,
      numberOfElements: 1,
    };
    service.getMatches({ page: 0, size: 15, sort: 'dateTime,desc' }).subscribe((res) => {
      expect(res.content).toHaveLength(1);
    });
    const req = httpTesting.expectOne((r) => r.url === service['baseUrl']);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('15');
    expect(req.request.params.get('sort')).toBe('dateTime,desc');
    req.flush(page);
  });

  it('should create batch matches via POST /batch', () => {
    const dto: BatchMatchRequestDTO = {
      clubId: 'c1',
      dayOfWeek: 'MONDAY',
      time: '14:00',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      zoneId: 'America/Sao_Paulo',
    };
    service.createBatchMatches(dto).subscribe((res) => {
      expect(res).toHaveLength(2);
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}/batch`);
    expect(req.request.method).toBe('POST');
    req.flush([match, { ...match, id: 'm2' }]);
  });

  it('should set match result via PATCH', () => {
    const dto: SetMatchResultRequestDTO = { teamChampionId: 10, clubMemberMvpId: 5 };
    const updated = { ...match, teamChampionId: 10, clubMemberMvpId: 5 };
    service.setResult('m1', dto).subscribe((res) => {
      expect(res.teamChampionId).toBe(10);
      expect(res.clubMemberMvpId).toBe(5);
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}/m1/result`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);
  });

  it('should fetch participants via GET', () => {
    const participants: MatchParticipantResponseDTO[] = [
      { id: 1, matchId: 'm1', clubMemberId: 100, position: 'LINE' },
    ];
    service.getParticipants('m1').subscribe((res) => {
      expect(res).toHaveLength(1);
      expect(res[0].position).toBe('LINE');
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}/m1/participants`);
    req.flush(participants);
  });

  it('should delete a match via DELETE', () => {
    service.deleteMatch('m1').subscribe((res) => {
      expect(res).toBeNull();
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}/m1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should fetch matches by club with clubId param', () => {
    const page: PageMatchResponseDTO = {
      content: [], totalElements: 0, totalPages: 0, number: 0, size: 15,
      first: true, last: true, empty: true, numberOfElements: 0,
    };
    service.getMatchesByClub('c1').subscribe();
    const req = httpTesting.expectOne((r) => r.url === service['baseUrl']);
    expect(req.request.params.get('clubId')).toBe('c1');
    req.flush(page);
  });

  it('should handle HTTP error gracefully', () => {
    service.getMatch('nonexistent').subscribe({
      error: (err) => {
        expect(err.status).toBe(404);
      },
    });
    const req = httpTesting.expectOne(`${service['baseUrl']}/nonexistent`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });
});
