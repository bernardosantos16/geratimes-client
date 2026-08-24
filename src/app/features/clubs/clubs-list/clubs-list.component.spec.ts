import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClubsListComponent } from './clubs-list.component';
import { ClubsService } from '@core/services/clubs.service';
import { ClubContextService } from '@core/services/club-context.service';
import { ToastService } from '@core/services/toast.service';
import { ClubResponseDTO } from '@core/models/api.models';

const CLUB: ClubResponseDTO = { id: 'c1', name: 'Meu Clube', nickname: 'MC', joinPolicy: 'INVITE_ONLY' };

describe('ClubsListComponent', () => {
  let fixture: ComponentFixture<ClubsListComponent>;
  let component: ClubsListComponent;
  let clubsMock: any;
  let toastMock: any;
  let contextMock: any;
  let router: Router;

  beforeEach(async () => {
    clubsMock = { getClubs: vi.fn().mockReturnValue(of([CLUB])), deleteClub: vi.fn() };
    toastMock = { success: vi.fn(), error: vi.fn() };
    contextMock = { setClubContext: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ClubsListComponent],
      providers: [
        provideRouter([]),
        { provide: ClubsService, useValue: clubsMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ClubContextService, useValue: contextMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClubsListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should load clubs on init', () => {
    expect(clubsMock.getClubs).toHaveBeenCalledWith('DIRECTOR');
    expect(component.clubs()).toEqual([CLUB]);
    expect(component.loading()).toBe(false);
  });

  it('should show error toast on load failure', () => {
    clubsMock.getClubs.mockReturnValue(throwError(() => new Error('fail')));

    component.loadClubs();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao carregar clubes.');
    expect(component.loading()).toBe(false);
  });

  it('should delete club and remove from list on confirmed delete', () => {
    clubsMock.deleteClub.mockReturnValue(of(void 0));
    component.clubs.set([CLUB, { ...CLUB, id: 'c2' }]);
    component['pendingDeleteId'].set(CLUB.id);

    component.onDeleteConfirmed();

    expect(clubsMock.deleteClub).toHaveBeenCalledWith(CLUB.id);
    expect(toastMock.success).toHaveBeenCalledWith('Clube excluído.');
    expect(component.clubs()).toEqual([{ ...CLUB, id: 'c2' }]);
  });

  it('should show error toast on delete failure', () => {
    clubsMock.deleteClub.mockReturnValue(throwError(() => new Error('fail')));
    component['pendingDeleteId'].set(CLUB.id);

    component.onDeleteConfirmed();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao excluir clube.');
  });

  it('should set club context on openClubOverview', () => {
    component.openClubOverview(CLUB.id);

    expect(contextMock.setClubContext).toHaveBeenCalledWith(CLUB.id, 'DIRECTOR');
  });
});
