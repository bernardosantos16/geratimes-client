import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatchesListComponent } from './matches-list.component';
import { MatchesService } from '@core/services/matches.service';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { MatchResponseDTO } from '@core/models/api.models';

const MATCH: MatchResponseDTO = {
  id: 'm1', clubId: 'c1', dateTime: '2026-01-01T10:00:00Z',
  teamCount: 2, participantCount: 10, hasResult: false,
};

describe('MatchesListComponent', () => {
  let fixture: ComponentFixture<MatchesListComponent>;
  let component: MatchesListComponent;
  let matchesMock: any;
  let clubsMock: any;
  let toastMock: any;

  beforeEach(async () => {
    matchesMock = {
      getMatchesByClub: vi.fn().mockReturnValue(
        of({ content: [MATCH], number: 0, totalPages: 3, totalElements: 30, size: 15 }),
      ),
    };
    clubsMock = { getClubs: vi.fn().mockReturnValue(of([{ id: 'c1' }, { id: 'c2' }])) };
    toastMock = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatchesListComponent],
      providers: [
        provideRouter([]),
        { provide: MatchesService, useValue: matchesMock },
        { provide: ClubsService, useValue: clubsMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1']]) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MatchesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load paginated matches on init', () => {
    expect(matchesMock.getMatchesByClub).toHaveBeenCalledWith('c1', { page: 0, size: 15, sort: 'dateTime,desc' });
    expect(component.matches()).toEqual([MATCH]);
    expect(component.currentPage()).toBe(0);
    expect(component.totalPages()).toBe(3);
  });

  it('should set isDirector when club is in director clubs', () => {
    expect(component.isDirector()).toBe(true);
  });

  it('should not be director when club not found', () => {
    clubsMock.getClubs.mockReturnValue(of([{ id: 'c99' }]));
    component.ngOnInit();
    expect(component.isDirector()).toBe(false);
  });

  it('should return true for upcoming matches', () => {
    const future = { ...MATCH, dateTime: '2099-12-31T23:59:00Z' };
    expect(component.isUpcoming(future)).toBe(true);
  });

  it('should return true for pending result', () => {
    const past = { ...MATCH, dateTime: '2020-01-01T10:00:00Z', teamChampionId: null, clubMemberMvpId: null };
    expect(component.isPendingResult(past)).toBe(true);
  });

  it('should show error toast on load failure', () => {
    matchesMock.getMatchesByClub.mockReturnValue(throwError(() => new Error('fail')));

    component.loadPage(1);

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao carregar partidas.');
    expect(component.loading()).toBe(false);
  });
});
