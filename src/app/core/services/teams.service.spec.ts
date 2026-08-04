import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TeamsService } from './teams.service';
import {
  TeamResponseDTO, GenerateTeamsRequestDTO, GenerateTeamsResponseDTO,
  SwapPlayersRequestDTO, PageDTO,
} from '../models/api.models';

describe('TeamsService', () => {
  let service: TeamsService;
  let httpTesting: HttpTestingController;
  const team: TeamResponseDTO = { id: 1, matchId: 'm1', clubJerseyId: 10, score: 0 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TeamsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeamsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpTesting.verify(); });

  it('should fetch team by id via GET', () => {
    service.getTeam(1).subscribe((res) => expect(res.id).toBe(1));
    const req = httpTesting.expectOne(`${service['baseUrl']}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(team);
  });

  it('should fetch teams by match with matchId param via GET', () => {
    const page: PageDTO<TeamResponseDTO> = { content: [team], totalElements: 1, totalPages: 1, number: 0, size: 10, first: true, last: true, empty: false, numberOfElements: 1 };
    service.getTeamsByMatch('m1').subscribe();
    const req = httpTesting.expectOne((r) => r.url === service['baseUrl'] && r.params.get('matchId') === 'm1');
    req.flush(page);
  });

  it('should create team via POST', () => {
    service.createTeam({ matchId: 'm1', clubJerseyId: 10 }).subscribe((res) => expect(res.matchId).toBe('m1'));
    const req = httpTesting.expectOne(service['baseUrl']);
    expect(req.request.method).toBe('POST');
    req.flush(team);
  });

  it('should update team jersey via PATCH', () => {
    service.updateTeamJersey(1, { clubJerseyId: 20 }).subscribe();
    const req = httpTesting.expectOne(`${service['baseUrl']}/1/jersey`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.clubJerseyId).toBe(20);
    req.flush({ ...team, clubJerseyId: 20 });
  });

  it('should generate teams via POST /generate', () => {
    const payload: GenerateTeamsRequestDTO = { matchId: 'm1', lineMemberIds: [1, 2, 3], goalkeeperMemberIds: [4], maxLinePlayers: 5 };
    const response: GenerateTeamsResponseDTO = { matchId: 'm1', teamCount: 1, teams: [{ teamId: 1, totalScore: 0, lineMemberIds: [1, 2, 3], goalkeeperMemberId: 4 }], unassignedGoalkeeperMemberIds: [] };
    service.generateTeams(payload).subscribe((res) => expect(res.teamCount).toBe(1));
    const req = httpTesting.expectOne(`${service['baseUrl']}/generate`);
    expect(req.request.method).toBe('POST');
    req.flush(response);
  });

  it('should swap players via POST /swap', () => {
    const payload: SwapPlayersRequestDTO = { matchId: 'm1', swaps: [{ memberIdFrom: 1, memberIdTo: 2 }] };
    const response: GenerateTeamsResponseDTO = { matchId: 'm1', teamCount: 1, teams: [], unassignedGoalkeeperMemberIds: [] };
    service.swapPlayers(payload).subscribe((res) => expect(res.matchId).toBe('m1'));
    const req = httpTesting.expectOne(`${service['baseUrl']}/swap`);
    expect(req.request.method).toBe('POST');
    req.flush(response);
  });
});
