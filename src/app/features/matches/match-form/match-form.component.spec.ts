import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatchFormComponent } from './match-form.component';
import { MatchesService } from '@core/services/matches.service';
import { ToastService } from '@core/services/toast.service';

describe('MatchFormComponent', () => {
  let fixture: ComponentFixture<MatchFormComponent>;
  let component: MatchFormComponent;
  let matchesMock: any;
  let toastMock: any;
  let router: Router;

  beforeEach(async () => {
    matchesMock = {
      createMatch: vi.fn().mockReturnValue(of({ id: 'm1', clubId: 'c1', dateTime: '2026-01-01T10:00:00Z' })),
      createBatchMatches: vi.fn(),
    };
    toastMock = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MatchFormComponent],
      providers: [
        provideRouter([]),
        { provide: MatchesService, useValue: matchesMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1']]) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MatchFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should set backLink from route params', () => {
    expect(component.backLink()).toBe('/clubs/c1');
  });

  it('should create single match and navigate on valid submit', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.mode.set('single');
    component.form.controls.dateTime.setValue('2026-01-01T10:00');

    component.onSubmit();

    expect(matchesMock.createMatch).toHaveBeenCalledWith({
      clubId: 'c1',
      dateTime: new Date('2026-01-01T10:00').toISOString(),
    });
    expect(toastMock.success).toHaveBeenCalledWith('Partida agendada!');
    expect(navSpy).toHaveBeenCalledWith(['/matches', 'm1']);
  });

  it('should show error on single submit failure', () => {
    matchesMock.createMatch.mockReturnValue(
      throwError(() => ({ error: { detail: 'Erro ao agendar.' } })),
    );
    component.mode.set('single');
    component.form.controls.dateTime.setValue('2026-01-01T10:00');

    component.onSubmit();

    expect(component.serverError()).toBe('Erro ao agendar.');
    expect(component.loading()).toBe(false);
  });

  it('should create batch matches and navigate on valid batch submit', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    matchesMock.createBatchMatches.mockReturnValue(of([
      { id: 'm1' }, { id: 'm2' }, { id: 'm3' },
    ]));
    component.mode.set('batch');
    component.form.patchValue({
      dayOfWeek: 'MONDAY',
      time: '20:00',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      zoneId: 'America/Sao_Paulo',
    });

    component.onSubmit();

    expect(matchesMock.createBatchMatches).toHaveBeenCalledWith(
      expect.objectContaining({ clubId: 'c1', dayOfWeek: 'MONDAY', time: '20:00' }),
    );
    expect(toastMock.success).toHaveBeenCalledWith('3 partidas agendadas!');
    expect(navSpy).toHaveBeenCalledWith(['/clubs', 'c1', 'matches']);
  });

  it('should mark required fields as touched on empty batch submit', () => {
    component.mode.set('batch');
    component.form.patchValue({ dayOfWeek: '', time: '', startDate: '', endDate: '' });

    component.onSubmit();

    expect(component.form.controls.dayOfWeek.touched).toBe(true);
    expect(component.form.controls.time.touched).toBe(true);
    expect(component.form.controls.startDate.touched).toBe(true);
    expect(component.form.controls.endDate.touched).toBe(true);
  });
});
