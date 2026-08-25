import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatchDetailComponent } from './match-detail-export.component';
import { MatchesService } from '@core/services/matches.service';
import { TeamsService } from '@core/services/teams.service';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import {
  MatchResponseDTO, ClubMemberResponseDTO, ClubJerseyResponseDTO, MatchParticipantResponseDTO, TeamResponseDTO, GenerateTeamsResponseDTO,
} from '@core/models/api.models';

const MATCH: MatchResponseDTO = {
  id: 'm1', clubId: 'c1', dateTime: '2026-01-01T10:00:00Z',
  teamChampionId: null, clubMemberMvpId: null,
};

const MEMBER: ClubMemberResponseDTO = {
  id: 1, name: 'João', rating: 4, timesMvp: 1, timesChampion: 2,
  clubRole: 'MEMBER', teamId: 1, isOwner: false
};

const PARTICIPANT: MatchParticipantResponseDTO = {
  matchId: 'm1', id: 1, clubMemberId: 1, position: 'LINE', teamId: 1
};

const TEAM: TeamResponseDTO = {
  matchId: 'm1', id: 1, score: 10, clubJerseyId: 1
};

const JERSEY: ClubJerseyResponseDTO = {
  id: 1, name: 'Time 1', hexColor: '#ff0000', clubId: 'c1', isGoalkeeperJersey: false,
};

describe('MatchDetailComponent', () => {
  let fixture: ComponentFixture<MatchDetailComponent>;
  let component: MatchDetailComponent;
  let matchesMock: any;
  let teamsMock: any;
  let clubsMock: any;
  let toastMock: any;
  let router: Router;

  beforeEach(async () => {
    matchesMock = {
      getMatch: vi.fn().mockReturnValue(of(MATCH)),
      getParticipants: vi.fn().mockReturnValue(of([PARTICIPANT, { ...PARTICIPANT, id: 2, clubMemberId: 2 }])),
      setResult: vi.fn(),
      deleteMatch: vi.fn(),
    };
    teamsMock = {
      getTeamsByMatch: vi.fn().mockReturnValue(of({ content: [TEAM], totalPages: 1, totalElements: 1, number: 0, size: 10 })),
      swapPlayers: vi.fn().mockReturnValue(of({
        matchId: 'm1', teamCount: 1,
        teams: [{ teamId: 1, totalScore: 10, lineMemberIds: [1], goalkeeperMemberId: undefined }],
        unassignedGoalkeeperMemberIds: [],
      } as GenerateTeamsResponseDTO)),
    };
    clubsMock = {
      getClubById: vi.fn().mockReturnValue(of({ id: 'c1', name: 'Clube', nickname: 'C', memberCount: 5 })),
      getMembers: vi.fn().mockReturnValue(of({ content: [MEMBER, { ...MEMBER, id: 2, name: 'Pedro' }], totalPages: 1, totalElements: 2, number: 0, size: 200 })),
      getJerseys: vi.fn().mockReturnValue(of([JERSEY, { ...JERSEY, id: 2, name: 'Time 2', hexColor: '#00ff00' }])),
      getClubs: vi.fn().mockReturnValue(of([{ id: 'c1', name: 'Clube', nickname: 'C', memberCount: 5 }])),
    };
    toastMock = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatchDetailComponent],
      providers: [
        provideRouter([]),
        { provide: MatchesService, useValue: matchesMock },
        { provide: TeamsService, useValue: teamsMock },
        { provide: ClubsService, useValue: clubsMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'm1']]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should load match data on init', () => {
    expect(matchesMock.getMatch).toHaveBeenCalledWith('m1');
    expect(teamsMock.getTeamsByMatch).toHaveBeenCalledWith('m1');
    expect(clubsMock.getMembers).toHaveBeenCalledWith('c1', { size: 200 });
    expect(clubsMock.getJerseys).toHaveBeenCalledWith('c1');
    expect(component.match()).toEqual(MATCH);
    expect(component.loading()).toBe(false);
  });

  it('should compute teamCards from teams', () => {
    const cards = component.teamCards();
    expect(cards.length).toBe(1);
    expect(cards[0].jerseyName).toBe('Time 1');
  });

  it('should compute mvpCandidates with unique member IDs', () => {
    const candidates = component.mvpCandidates();
    expect(candidates.length).toBe(2);
  });

  it('should compute freeGoalkeepersCard when GK has no team', () => {
    const free = component.freeGoalkeepersCard();
    // No GK participants in this test data, should be null
    expect(free).toBeNull();
  });

  it('should toggle member selection', () => {
    component.clearAll();
    expect(component.isSelected(MEMBER.id)).toBe(false);

    component.toggleMember(MEMBER);
    expect(component.isSelected(MEMBER.id)).toBe(true);

    component.toggleMember(MEMBER);
    expect(component.isSelected(MEMBER.id)).toBe(false);
  });

  it('should select and clear all members', () => {
    component.selectAll();
    expect(component.selectedIds().size).toBe(2);

    component.clearAll();
    expect(component.selectedIds().size).toBe(0);
  });

  it('should delete match and navigate', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    matchesMock.deleteMatch.mockReturnValue(of(void 0));

    component.deleteMatch();

    expect(matchesMock.deleteMatch).toHaveBeenCalledWith('m1');
    expect(toastMock.success).toHaveBeenCalledWith('Partida excluída.');
  });

  it('should show error toast on delete failure', () => {
    matchesMock.deleteMatch.mockReturnValue(throwError(() => new Error('fail')));

    component.deleteMatch();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao excluir partida.');
  });
});
