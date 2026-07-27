import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SquareRatingComponent } from './square-rating.component';

describe('SquareRatingComponent', () => {
  let fixture: ComponentFixture<SquareRatingComponent>;
  let component: SquareRatingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SquareRatingComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SquareRatingComponent);
    component = fixture.componentInstance;
  });

  it('should render max squares', () => {
    fixture.detectChanges();
    const squares = fixture.debugElement.queryAll(By.css('.rating-square'));
    expect(squares.length).toBe(5);
  });

  it('should fill value squares', () => {
    component.value = 3;
    fixture.detectChanges();
    const squares = fixture.debugElement.queryAll(By.css('.rating-square'));
    const filled = squares.filter(s => s.classes['filled']).length;
    expect(filled).toBe(3);
  });

  it('should clamp value above max', () => {
    fixture.detectChanges();
    component.value = 7;
    expect(component.normalizedValue).toBe(5);
  });

  it('should clamp value below 0', () => {
    fixture.detectChanges();
    component.value = -2;
    expect(component.normalizedValue).toBe(0);
  });

  it('should treat null as 0', () => {
    component.value = null;
    fixture.detectChanges();
    const squares = fixture.debugElement.queryAll(By.css('.rating-square'));
    const filled = squares.filter(s => s.classes['filled']).length;
    expect(filled).toBe(0);
  });

  it('should emit ratingChange on click when interactive', () => {
    const spy = vi.fn();
    component.ratingChange.subscribe(spy);
    component.interactive = true;
    fixture.detectChanges();

    const squares = fixture.debugElement.queryAll(By.css('.rating-square'));
    squares[3].triggerEventHandler('click', null);
    expect(spy).toHaveBeenCalledWith(4);
  });

  it('should not emit on click when not interactive', () => {
    const spy = vi.fn();
    component.ratingChange.subscribe(spy);
    component.interactive = false;
    fixture.detectChanges();

    const squares = fixture.debugElement.queryAll(By.css('.rating-square'));
    squares[2].triggerEventHandler('click', null);
    expect(spy).not.toHaveBeenCalled();
  });
});
