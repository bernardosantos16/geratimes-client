import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TeamCardComponent } from './team-card.component';
import { TeamUiModel, PlayerUiModel } from '@core/models/team-ui.model';

const GOALKEEPER: PlayerUiModel = {
  id: 1, name: 'Goleiro', rating: 4, timesChampion: 1, timesMvp: 0,
  position: 'GOAL', teamId: 1, isGoalkeeper: true,
};
const LINE: PlayerUiModel = {
  id: 2, name: 'Linha', rating: 3, timesChampion: 0, timesMvp: 1,
  position: 'LINE', teamId: 1, isGoalkeeper: false,
};
const TEAM: TeamUiModel = {
  id: 1, score: 3, jerseyName: 'Vermelho', jerseyColor: '#ff0000',
  players: [LINE, { ...LINE, id: 3, name: 'Linha 2' }],
  goalkeeper: GOALKEEPER,
};

describe('TeamCardComponent', () => {
  let fixture: ComponentFixture<TeamCardComponent>;
  let component: TeamCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TeamCardComponent);
    component = fixture.componentInstance;
    component.team = TEAM;
    fixture.detectChanges();
  });

  it('should concat line players and goalkeeper in allPlayers', () => {
    const all = component.allPlayers();
    expect(all.length).toBe(3);
    expect(all[0].position).toBe('LINE');
    expect(all[2].position).toBe('GOAL');
  });

  it('should return player count', () => {
    expect(component.playerCount()).toBe(3);
  });

  it('should return player count without goalkeeper', () => {
    component.team = { ...TEAM, goalkeeper: null };
    fixture.detectChanges();
    expect(component.playerCount()).toBe(2);
  });

  it('should emit swapRequested on player swap', () => {
    const spy = vi.fn();
    component.swapRequested.subscribe(spy);

    component.onPlayerSwap({ from: LINE, to: GOALKEEPER });

    expect(spy).toHaveBeenCalledWith({ from: LINE, to: GOALKEEPER });
  });

  it('should render jersey name', () => {
    const name = fixture.debugElement.query(By.css('.team-label'));
    expect(name.nativeElement.textContent.trim()).toBe('Vermelho');
  });
});
