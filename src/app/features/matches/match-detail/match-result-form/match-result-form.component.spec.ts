import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatchResultFormComponent } from './match-result-form.component';
import { TeamUiModel, PlayerUiModel } from '@core/models/team-ui.model';

const TEAMS: TeamUiModel[] = [
  { id: 1, jerseyName: 'Time 1', jerseyColor: '#111', score: null, players: [], goalkeeper: null },
  { id: 2, jerseyName: 'Time 2', jerseyColor: '#222', score: null, players: [], goalkeeper: null },
];

const MVP: PlayerUiModel[] = [
  { id: 10, name: 'João', rating: 4, timesChampion: 2, timesMvp: 1, position: 'LINE', teamId: 1, isGoalkeeper: false },
  { id: 20, name: 'Pedro', rating: 5, timesChampion: 3, timesMvp: 2, position: 'LINE', teamId: 2, isGoalkeeper: false },
];

describe('MatchResultFormComponent', () => {
  let fixture: ComponentFixture<MatchResultFormComponent>;
  let component: MatchResultFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchResultFormComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MatchResultFormComponent);
    component = fixture.componentInstance;
    component.teams = TEAMS;
    component.mvpCandidates = MVP;
  });

  it('should allow saving when both champion and MVP are selected', () => {
    component.championTeamId = 1;
    component.mvpMemberId = 10;
    component.saving = false;
    expect(component.canSave()).toBe(true);
  });

  it('should block save when saving is in progress', () => {
    component.championTeamId = 1;
    component.mvpMemberId = 10;
    component.saving = true;
    expect(component.canSave()).toBe(false);
  });

  it('should block save when championTeamId is null', () => {
    component.championTeamId = null;
    component.mvpMemberId = 10;
    component.saving = false;
    expect(component.canSave()).toBe(false);
  });

  it('should block save when mvpMemberId is null', () => {
    component.championTeamId = 1;
    component.mvpMemberId = null;
    component.saving = false;
    expect(component.canSave()).toBe(false);
  });

  it('should show "Pendente" badge when no result', () => {
    component.hasResult = false;
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.result-badge.pending'));
    expect(badge.nativeElement.textContent.trim()).toBe('Pendente');
  });

  it('should show "Definido" badge when result exists', () => {
    component.hasResult = true;
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.result-badge'));
    expect(badge.nativeElement.textContent.trim()).toBe('Definido');
  });

  it('should show empty message when no teams', () => {
    component.teams = [];
    fixture.detectChanges();
    const msg = fixture.debugElement.query(By.css('.empty-msg'));
    expect(msg).toBeTruthy();
  });

  it('should disable save button when canSave returns false', () => {
    component.championTeamId = null;
    component.mvpMemberId = null;
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.result-submit');
    expect(btn.disabled).toBe(true);
  });

  it('should enable save button when canSave returns true', () => {
    component.championTeamId = 1;
    component.mvpMemberId = 10;
    component.saving = false;
    component.hasResult = false;
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.result-submit');
    expect(btn.disabled).toBe(false);
  });
});
