import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '@core/services/auth.service';
import { DashboardService } from '@core/services/dashboard.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ToastService } from '@core/services/toast.service';
import { ClubResponseDTO } from '@core/models/api.models';

const CLUB: ClubResponseDTO = { id: 'c1', name: 'Meu Clube', nickname: 'MC'};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dashboardMock: any;
  let toastMock: any;
  let contextMock: any;

  beforeEach(async () => {
    dashboardMock = {
      loadDashboard: vi.fn().mockReturnValue(of({
        ownerClubs: [CLUB],
        memberClubs: [{ ...CLUB, id: 'c2' }],
        pendingMatches: [{ id: 'm1', opponentName: 'Time B', dateTime: '2026-01-01T10:00Z', teamCount: 2, participantCount: 8 }],
        upcomingMatches: [],
        upcomingMatchesCount: 3,
        recentResults: [{ id: 'm0', opponentName: 'Time A', dateTime: '2025-12-01T10:00Z', championName: 'Vermelho', mvpName: 'João' }],
        completedMatchesCount: 5,
      })),
    };
    toastMock = { error: vi.fn() };
    contextMock = { setClubContext: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ClubContextService, useValue: contextMock },
        { provide: AuthService, useValue: { user: signal({ name: 'João', nickname: 'joao' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load dashboard data on init', () => {
    expect(dashboardMock.loadDashboard).toHaveBeenCalled();
  });

  it('should set loading to false after successful load', () => {
    expect(component.loading()).toBe(false);
  });

  it('should populate owner clubs and member clubs', () => {
    expect(component.ownerClubs()).toEqual([CLUB]);
    expect(component.memberClubs().length).toBe(1);
  });

  it('should populate upcoming and completed match counts', () => {
    expect(component.upcomingMatchesCount()).toBe(3);
    expect(component.completedMatchesCount()).toBe(5);
  });

  it('should set club context on selectClub', () => {
    component.selectClub(CLUB, 'DIRECTOR');

    expect(contextMock.setClubContext).toHaveBeenCalledWith(CLUB.id, 'DIRECTOR');
  });

  it('should show error toast on load failure', () => {
    dashboardMock.loadDashboard.mockReturnValue(throwError(() => ({ error: {} })));

    component.ngOnInit();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao carregar dashboard.');
    expect(component.loading()).toBe(false);
  });
});
