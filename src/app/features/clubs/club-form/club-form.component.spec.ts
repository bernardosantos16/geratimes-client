import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClubFormComponent } from './club-form.component';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubResponseDTO } from '@core/models/api.models';

const CLUB: ClubResponseDTO = { id: 'c1', name: 'Meu Clube', nickname: 'MC1', memberCount: 5 };

function validClubForm(component: ClubFormComponent) {
  component.form.patchValue({ name: 'Novo Clube', nickname: 'Nic' });
}

describe('ClubFormComponent', () => {
  let fixture: ComponentFixture<ClubFormComponent>;
  let component: ClubFormComponent;
  let clubsMock: any;
  let toastMock: any;
  let router: Router;

  function setup(params: Record<string, string> = {}) {
    const paramMap = new Map(Object.entries(params));

    TestBed.configureTestingModule({
      imports: [ClubFormComponent],
      providers: [
        provideRouter([]),
        { provide: ClubsService, useValue: clubsMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClubFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  }

  describe('create mode', () => {
    beforeEach(async () => {
      clubsMock = {
        getClubById: vi.fn(),
        createClub: vi.fn().mockReturnValue(of(CLUB)),
        updateClub: vi.fn(),
        addJersey: vi.fn().mockReturnValue(of({})),
      };
      toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
      setup({});
      fixture.detectChanges();
    });

    it('should pre-fill 3 jerseys on create', () => {
      expect(component.jerseyForms().length).toBe(3);
      expect(component.gkCount).toBe(1);
      expect(component.lineCount).toBe(2);
    });

    it('should go to jersey step when form is valid', () => {
      validClubForm(component);
      component.goToJerseys();
      expect(component.step()).toBe(2);
    });

    it('should not advance when form is invalid', () => {
      component.form.patchValue({ name: '', nickname: '' });
      component.goToJerseys();
      expect(component.step()).toBe(1);
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('should navigate back to club step', () => {
      component.step.set(2);
      component.backToClub();
      expect(component.step()).toBe(1);
    });

    it('should validate at least 2 line jerseys on submit', () => {
      validClubForm(component);
      component.jerseyForms.set([]);
      expect(component.lineCount).toBe(0);

      component.onSubmit();

      expect(toastMock.error).toHaveBeenCalledWith('Adicione pelo menos 2 camisas de linha.');
    });

    it('should add and remove jersey rows', () => {
      component.addJerseyRow({ name: 'Extra', hexColor: '#aaaaaa' });
      expect(component.jerseyForms().length).toBe(4);

      const newId = component.jerseyForms()[3].get('id')!.value;
      component.removeJerseyRow(newId);
      expect(component.jerseyForms().length).toBe(3);
    });

    it('should create club on valid submit', () => {
      validClubForm(component);

      component.onSubmit();

      expect(clubsMock.createClub).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Novo Clube' }),
      );
    });

    it('should show error on submit failure', () => {
      clubsMock.createClub.mockReturnValue(throwError(() => ({ error: { detail: 'Erro ao salvar.' } })));
      validClubForm(component);

      component.onSubmit();

      expect(component.serverError()).toBe('Erro ao salvar.');
      expect(component.loading()).toBe(false);
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      clubsMock = {
        getClubById: vi.fn().mockReturnValue(of(CLUB)),
        createClub: vi.fn(),
        updateClub: vi.fn().mockReturnValue(of(CLUB)),
        addJersey: vi.fn(),
      };
      toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
      setup({ id: 'c1' });
    });

    it('should set isEdit and fetch club on init', () => {
      fixture.detectChanges();
      expect(component.isEdit()).toBe(true);
      expect(clubsMock.getClubById).toHaveBeenCalledWith('c1');
    });

    it('should update club on edit submit', () => {
      fixture.detectChanges();
      component.form.patchValue({ name: 'Clube Editado', nickname: 'CE1' });

      component.onSubmit();

      expect(clubsMock.updateClub).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ name: 'Clube Editado' }),
      );
    });
  });
});
