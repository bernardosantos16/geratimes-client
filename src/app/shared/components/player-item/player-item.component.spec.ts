import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PlayerItemComponent } from './player-item.component';
import { PlayerUiModel } from '@core/models/team-ui.model';
import { dragSwapState } from '@shared/components/team-card/drag-state';

const PLAYER: PlayerUiModel = {
  id: 1, name: 'João', rating: 4, timesChampion: 2, timesMvp: 1,
  position: 'LINE', teamId: 1, isGoalkeeper: false,
};

const OTHER_PLAYER: PlayerUiModel = {
  id: 5, name: 'Pedro', rating: 3, timesChampion: 0, timesMvp: 2,
  position: 'LINE', teamId: 99, isGoalkeeper: false,
};

function createDragEvent(): Event {
  return new Event('drop', { bubbles: true, cancelable: true });
}

function createClickEvent(): MouseEvent {
  return new MouseEvent('click', { bubbles: true, cancelable: true });
}

describe('PlayerItemComponent', () => {
  let fixture: ComponentFixture<PlayerItemComponent>;
  let component: PlayerItemComponent;

  function createComponent(player: PlayerUiModel, draggable = false) {
    fixture = TestBed.createComponent(PlayerItemComponent);
    component = fixture.componentInstance;
    component.player = player;
    component.draggable = draggable;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dragSwapState.source.set(null);
    dragSwapState.target.set(null);
    dragSwapState.selected.set(null);
    dragSwapState.justDragged = false;

    await TestBed.configureTestingModule({
      imports: [PlayerItemComponent],
    }).compileComponents();
  });

  it('should render player name', () => {
    createComponent(PLAYER);
    const name = fixture.debugElement.query(By.css('.player-name'));
    expect(name.nativeElement.textContent.trim()).toBe('João');
  });

  it('should show GK label for goalkeeper', () => {
    createComponent({
      id: 2, name: 'Goleiro', rating: 5, timesChampion: 3, timesMvp: 0,
      position: 'GOAL', teamId: 1, isGoalkeeper: true,
    });
    const gkLabel = fixture.debugElement.query(By.css('.gk-label'));
    expect(gkLabel).toBeTruthy();
  });

  it('should show drag handle when draggable', () => {
    createComponent(PLAYER, true);
    const handle = fixture.debugElement.query(By.css('.drag-handle'));
    expect(handle).toBeTruthy();
  });

  it('should set isDragOver true when source from different team targets this player', () => {
    createComponent(PLAYER);
    dragSwapState.source.set({ ...PLAYER, id: 5, teamId: 99 });
    dragSwapState.target.set(PLAYER);
    expect(component.isDragOver()).toBe(true);
  });

  it('should return false when source and target are same team', () => {
    createComponent(PLAYER);
    dragSwapState.source.set({ ...PLAYER, id: 5 });
    dragSwapState.target.set(PLAYER);
    expect(component.isDragOver()).toBe(false);
  });

  it('should emit swapRequested on drop from different team', () => {
    createComponent(PLAYER, true);
    const spy = vi.fn();
    component.swapRequested.subscribe(spy);

    const source = { ...PLAYER, id: 5, teamId: 99 };
    dragSwapState.source.set(source);
    component.onDrop(createDragEvent() as DragEvent);

    expect(spy).toHaveBeenCalledWith({ from: source, to: PLAYER });
  });

  it('should not emit swapRequested when not draggable', () => {
    createComponent(PLAYER, false);
    const spy = vi.fn();
    component.swapRequested.subscribe(spy);

    component.onDrop(createDragEvent() as DragEvent);

    expect(spy).not.toHaveBeenCalled();
  });

  describe('tap-to-select', () => {
    it('should set isSelected true when this player is the tap-selected player', () => {
      createComponent(PLAYER);
      dragSwapState.selected.set(PLAYER);
      expect(component.isSelected()).toBe(true);
    });

    it('should set isSelected false for a different player', () => {
      createComponent(PLAYER);
      dragSwapState.selected.set(OTHER_PLAYER);
      expect(component.isSelected()).toBe(false);
    });

    it('should select this player when no player is currently selected', () => {
      createComponent(PLAYER, true);
      component.onTapSelect(createClickEvent());
      expect(dragSwapState.selected()).toEqual(PLAYER);
    });

    it('should deselect when tapping the already-selected player', () => {
      createComponent(PLAYER, true);
      dragSwapState.selected.set(PLAYER);
      component.onTapSelect(createClickEvent());
      expect(dragSwapState.selected()).toBeNull();
    });

    it('should emit swapRequested when tapping another player from a different team', () => {
      createComponent(PLAYER, true);
      const spy = vi.fn();
      component.swapRequested.subscribe(spy);

      dragSwapState.selected.set(OTHER_PLAYER);
      component.onTapSelect(createClickEvent());

      expect(spy).toHaveBeenCalledWith({ from: OTHER_PLAYER, to: PLAYER });
      expect(dragSwapState.selected()).toBeNull();
    });

    it('should not emit swapRequested when tapping a player from the same team', () => {
      createComponent(PLAYER, true);
      const spy = vi.fn();
      component.swapRequested.subscribe(spy);

      dragSwapState.selected.set({ ...PLAYER, id: 2, teamId: PLAYER.teamId });
      component.onTapSelect(createClickEvent());

      expect(spy).not.toHaveBeenCalled();
      expect(dragSwapState.selected()).toBeNull();
    });

    it('should not respond to tap when not draggable', () => {
      createComponent(PLAYER, false);
      component.onTapSelect(createClickEvent());
      expect(dragSwapState.selected()).toBeNull();
    });

    it('should ignore tap when justDragged flag is true (post-drag click)', () => {
      createComponent(PLAYER, true);
      dragSwapState.justDragged = true;
      component.onTapSelect(createClickEvent());
      expect(dragSwapState.selected()).toBeNull();
    });
  });
});
