import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { GenerateTeamsComponent } from './generate-teams.component';
import { TeamsService } from '@core/services/teams.service';
import { MatchesService } from '@core/services/matches.service';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import {
  ClubMemberResponseDTO,
  ClubJerseyResponseDTO,
  MatchResponseDTO,
  GenerateTeamsResponseDTO,
  GeneratedTeamDTO
} from '@core/models/api.models';

const MATCH: MatchResponseDTO = {
  id: 'm1', clubId: 'c1', dateTime: '2026-01-01T10:00:00Z',
  teamChampionId: null, clubMemberMvpId: null
};

const MEMBER: ClubMemberResponseDTO = {
  id: 1, name: 'João', rating: 4, timesMvp: 2, timesChampion: 3,
  clubRole: 'MEMBER', teamId: 1, isOwner: false
};

const JERSEY: ClubJerseyResponseDTO = { id: 1, name: 'Time 1', hexColor: '#ff0000', clubId: 'c1', isGoalkeeperJersey: false };

const RESULT: GenerateTeamsResponseDTO = {
  matchId: 'm1',
  teamCount: 1,
  teams: [{ teamId: 1, totalScore: 10, lineMemberIds: [1, 2] }, { teamId: 2, totalScore: 10, lineMemberIds: [3, 4] }],
  unassignedGoalkeeperMemberIds: []
};

describe('GenerateTeamsComponent', () => {
  let fixture: ComponentFixture<GenerateTeamsComponent>;
  let component: GenerateTeamsComponent;

  let matchesMock: any;
  let clubsMock: any;
  let teamsMock: any;
  let toastMock: any;

  function memberWithRole(id: number, assignedAs: 'line' | 'goalkeeper' | null = null): any {
    return { ...MEMBER, id, assignedAs };
  }

  beforeEach(async () => {
    matchesMock = { getMatch: vi.fn().mockReturnValue(of(MATCH)) };
    clubsMock = {
      getClubs: vi.fn().mockReturnValue(of([{ id: 'c1', name: 'Clube', nickname: 'C', memberCount: 10 }])),
      getMembers: vi.fn().mockReturnValue(of({
        content: [MEMBER, { ...MEMBER, id: 2 }, { ...MEMBER, id: 3 }, { ...MEMBER, id: 4 }, { ...MEMBER, id: 5 }],
        totalPages: 1, totalElements: 5, number: 0, size: 200,
      })),
      getJerseys: vi.fn().mockReturnValue(of([JERSEY, { ...JERSEY, id: 2 }])),
    };
    teamsMock = { generateTeams: vi.fn().mockReturnValue(of(RESULT)), swapPlayers: vi.fn().mockReturnValue(of(RESULT)) };
    toastMock = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GenerateTeamsComponent],
      providers: [
        provideRouter([]),
        { provide: MatchesService, useValue: matchesMock },
        { provide: ClubsService, useValue: clubsMock },
        { provide: TeamsService, useValue: teamsMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['matchId', 'm1']]) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateTeamsComponent);
    component = fixture.componentInstance;
  });

  it('should load match and club data on init', () => {
    fixture.detectChanges();
    expect(matchesMock.getMatch).toHaveBeenCalledWith('m1');
    expect(clubsMock.getClubs).toHaveBeenCalledWith('DIRECTOR');
    expect(clubsMock.getMembers).toHaveBeenCalledWith('c1', { size: 200 });
    expect(clubsMock.getJerseys).toHaveBeenCalledWith('c1');
    expect(component.members().length).toBe(5);
    expect(component.jerseys().length).toBe(2);
  });

  it('should set loading to false after data is loaded', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });

  it('should set member position correctly', () => {
    fixture.detectChanges();
    const m = component.members()[0];
    component.setPosition(m, 'line');
    const updated = component.members().find(x => x.id === m.id);
    expect(updated?.assignedAs).toBe('line');
  });

  it('should remove assigned position', () => {
    fixture.detectChanges();
    const m = component.members()[0];
    component.setPosition(m, 'line');
    component.setPosition({ ...m, assignedAs: 'line' }, null);
    const updated = component.members().find(x => x.id === m.id);
    expect(updated?.assignedAs).toBeNull();
  });

  it('should compute estimated teams from line count', () => {
    fixture.detectChanges();
    const members = component.members();
    component.setPosition(members[0], 'line');
    component.setPosition(members[1], 'line');
    component.setPosition(members[2], 'line');
    component.setPosition(members[3], 'line');
    component.setPosition(members[4], 'goalkeeper');
    expect(component.lineCount()).toBe(4);
    expect(component.goalkeeperCount()).toBe(1);
    expect(component.estimatedTeams()).toBe(0); // floor(4/5) = 0
  });

  it('should navigate between steps', () => {
    fixture.detectChanges();
    expect(component.currentStep()).toBe('select-players');
    component.goToStep('configure');
    expect(component.currentStep()).toBe('configure');
    component.goToStep('result');
    expect(component.currentStep()).toBe('result');
  });

  it('should generate teams and set result on valid config', () => {
    fixture.detectChanges();
    const members = component.members();
    members.forEach(m => component.setPosition(m, 'line'));
    component.goToStep('configure');

    component.generateTeams();

    expect(teamsMock.generateTeams).toHaveBeenCalledWith(expect.objectContaining({ matchId: 'm1' }));
    expect(component.currentStep()).toBe('result');
    expect(component.result()).toEqual(RESULT);
    expect(toastMock.success).toHaveBeenCalled();
  });
});
