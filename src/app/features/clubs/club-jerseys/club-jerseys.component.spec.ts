import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ClubJerseysComponent } from './club-jerseys.component';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { ClubJerseyResponseDTO } from '@core/models/api.models';

const JERSEY: ClubJerseyResponseDTO = { id: 1, name: 'Time 1', hexColor: '#ff0000', clubId: 'c1', isGoalkeeperJersey: false };

describe('ClubJerseysComponent', () => {
  let fixture: ComponentFixture<ClubJerseysComponent>;
  let component: ClubJerseysComponent;
  let clubsMock: any;
  let toastMock: any;
  let store: ClubDetailStore;

  beforeEach(async () => {
    clubsMock = {
      getJerseys: vi.fn().mockReturnValue(of([JERSEY])),
      addJersey: vi.fn(),
      deleteJersey: vi.fn(),
    };
    toastMock = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ClubJerseysComponent],
      providers: [
        { provide: ClubsService, useValue: clubsMock },
        { provide: ToastService, useValue: toastMock },
        ClubDetailStore,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClubJerseysComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(ClubDetailStore);
    store.clubId.set('c1');
    fixture.detectChanges();
  });

  it('should load jerseys on init', () => {
    expect(clubsMock.getJerseys).toHaveBeenCalledWith('c1');
    expect(store.jerseys()).toEqual([JERSEY]);
  });

  it('should show error toast on load failure', () => {
    clubsMock.getJerseys.mockReturnValue(throwError(() => new Error('fail')));

    component['loadJerseys']();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao carregar camisas.');
  });

  it('should add jersey on valid form submit', () => {
    clubsMock.addJersey.mockReturnValue(of(JERSEY));
    component.jerseyForm.patchValue({ name: 'Time A', hexColor: '#00ff00', isGoalkeeperJersey: false });

    component.addJersey();

    expect(clubsMock.addJersey).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Time A' }));
    expect(store.jerseys()).toContainEqual(JERSEY);
    expect(toastMock.success).toHaveBeenCalledWith('Camisa adicionada!');
  });

  it('should block add when form is invalid', () => {
    component.jerseyForm.patchValue({ name: '', hexColor: '', isGoalkeeperJersey: false });

    component.addJersey();

    expect(clubsMock.addJersey).not.toHaveBeenCalled();
  });

  it('should delete jersey and update store', () => {
    clubsMock.deleteJersey.mockReturnValue(of(void 0));
    store.jerseys.set([JERSEY, { ...JERSEY, id: 2 }]);

    component.deleteJersey(JERSEY.id);

    expect(clubsMock.deleteJersey).toHaveBeenCalledWith('c1', JERSEY.id);
    expect(store.jerseys().length).toBe(1);
    expect(toastMock.success).toHaveBeenCalledWith('Camisa removida.');
  });

  it('should show error toast on delete failure', () => {
    clubsMock.deleteJersey.mockReturnValue(throwError(() => new Error('fail')));

    component.deleteJersey(JERSEY.id);

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao remover camisa.');
  });
});
