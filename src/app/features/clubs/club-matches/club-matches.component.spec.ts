import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClubMatchesComponent } from './club-matches.component';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { MatchResponseDTO } from '@core/models/api.models';

const MATCH: MatchResponseDTO = {
  id: 'm1', clubId: 'c1', dateTime: '2026-01-01T10:00:00Z',
  teamCount: 2, participantCount: 10, hasResult: false,
};

describe('ClubMatchesComponent', () => {
  let fixture: ComponentFixture<ClubMatchesComponent>;
  let component: ClubMatchesComponent;
  let matchesMock: any;
  let toastMock: any;
  let store: ClubDetailStore;

  beforeEach(async () => {
    matchesMock = {
      getMatchesByClubAndUpcoming: vi.fn().mockReturnValue(
        of({ content: [MATCH], number: 0, totalPages: 1, totalElements: 1, size: 100 }),
      ),
    };
    toastMock = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ClubMatchesComponent],
      providers: [
        provideRouter([]),
        { provide: MatchesService, useValue: matchesMock },
        { provide: ToastService, useValue: toastMock },
        ClubDetailStore,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClubMatchesComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(ClubDetailStore);
    store.clubId.set('c1');
    fixture.detectChanges();
  });

  it('should load upcoming matches on init', () => {
    expect(matchesMock.getMatchesByClubAndUpcoming).toHaveBeenCalledWith('c1', { size: 100 });
    expect(store.matches()).toEqual([MATCH]);
  });

  it('should show error toast on load failure', () => {
    matchesMock.getMatchesByClubAndUpcoming.mockReturnValue(
      throwError(() => new Error('fail')),
    );

    component['loadMatches']();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao carregar partidas.');
  });
});
