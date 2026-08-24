import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { DashboardService, DashboardData } from './dashboard.service';
import { ClubResponseDTO, PageMatchResponseDTO } from '../models/api.models';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const directorClub: ClubResponseDTO = { id: 'c1', name: 'Ferino FC', nickname: 'ferino', joinPolicy: 'INVITE_ONLY' };
  const memberClub: ClubResponseDTO = { id: 'c2', name: 'Other FC', nickname: 'other', joinPolicy: 'OPEN' };

  function emptyPage(): PageMatchResponseDTO {
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 15,
      first: true, last: true, empty: true, numberOfElements: 0 };
  }

  it('should load dashboard data with owner and member clubs', () => {
    service.loadDashboard().subscribe((data: DashboardData) => {
      expect(data.ownerClubs).toHaveLength(1);
      expect(data.ownerClubs[0].name).toBe('Ferino FC');
      expect(data.memberClubs).toHaveLength(1);
      expect(data.pendingMatches).toEqual([]);
      expect(data.upcomingMatchesCount).toBe(0);
      expect(data.completedMatchesCount).toBe(0);
    });

    // director clubs
    httpTesting.expectOne((r) => r.url.includes('/api/clubs') && r.params.get('clubRole') === 'DIRECTOR')
      .flush([directorClub]);
    // member clubs
    httpTesting.expectOne((r) => r.url.includes('/api/clubs') && r.params.get('clubRole') === 'MEMBER')
      .flush([memberClub]);
    // matchesPendingResult uses getMatchesByClub with size=100
    httpTesting.expectOne((r) => r.url === 'https://api.geniofc.com.br/api/matches' && r.params.get('clubId') === 'c1' && r.params.get('size') === '100')
      .flush(emptyPage());
    // upcoming count for directorClub via getMatchesByClubAndUpcoming
    httpTesting.expectOne((r) => r.url.includes('/api/matches/upcoming') && r.params.get('clubId') === 'c1' && r.params.get('size') === '1')
      .flush(emptyPage());
    // upcoming count for memberClub
    httpTesting.expectOne((r) => r.url.includes('/api/matches/upcoming') && r.params.get('clubId') === 'c2' && r.params.get('size') === '1')
      .flush(emptyPage());
    // recent results for directorClub via getMatchesByClub
    httpTesting.expectOne((r) => r.url === 'https://api.geniofc.com.br/api/matches' && r.params.get('clubId') === 'c1' && r.params.get('size') === '15')
      .flush(emptyPage());
    // recent results for memberClub
    httpTesting.expectOne((r) => r.url === 'https://api.geniofc.com.br/api/matches' && r.params.get('clubId') === 'c2' && r.params.get('size') === '15')
      .flush(emptyPage());
    // upcoming matches list for directorClub
    httpTesting.expectOne((r) => r.url.includes('/api/matches/upcoming') && r.params.get('clubId') === 'c1' && r.params.get('size') === '5')
      .flush(emptyPage());
    // upcoming matches list for memberClub
    httpTesting.expectOne((r) => r.url.includes('/api/matches/upcoming') && r.params.get('clubId') === 'c2' && r.params.get('size') === '5')
      .flush(emptyPage());
  });
});
