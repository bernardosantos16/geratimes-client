import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { MemberCardComponent } from './member-card.component';

const MEMBER: ClubMemberResponseDTO = {
  id: 1,
  name: 'João Silva',
  rating: 4,
  clubRole: 'MEMBER',
  timesMvp: 3,
  timesChampion: 2,
  position: 'MEIA',
  clubId: 10,
};

describe('MemberCardComponent', () => {
  let fixture: ComponentFixture<MemberCardComponent>;
  let component: MemberCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MemberCardComponent);
    component = fixture.componentInstance;
    component.member = MEMBER;
  });

  it('should render member name', () => {
    fixture.detectChanges();
    const nameEl = fixture.debugElement.query(By.css('.player-name'));
    expect(nameEl.nativeElement.textContent.trim()).toBe('João Silva');
  });

  it('should show rating when showRating is true', () => {
    component.showRating = true;
    fixture.detectChanges();
    const rating = fixture.debugElement.query(By.css('app-square-rating'));
    expect(rating).toBeTruthy();
  });

  it('should hide rating when showRating is false', () => {
    component.showRating = false;
    fixture.detectChanges();
    const rating = fixture.debugElement.query(By.css('app-square-rating'));
    expect(rating).toBeNull();
  });

  it('should display MVP and Champion stats', () => {
    fixture.detectChanges();
    const stats = fixture.debugElement.queryAll(By.css('.stat-value'));
    const values = stats.map(s => s.nativeElement.textContent.trim());
    expect(values).toContain('3x');
    expect(values).toContain('2x');
  });

  it('should show director badge when clubRole is DIRECTOR', () => {
    component.member = { ...MEMBER, clubRole: 'DIRECTOR' };
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.role-badge.director'));
    expect(badge).toBeTruthy();
  });

  it('should emit selected on click when clickable', () => {
    const spy = vi.fn();
    component.selected.subscribe(spy);
    component.clickable = true;
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('.member-card'));
    card.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledWith(component.member);
  });

  it('should not emit selected when not clickable', () => {
    const spy = vi.fn();
    component.selected.subscribe(spy);
    component.clickable = false;
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('.member-card'));
    card.triggerEventHandler('click', null);

    expect(spy).not.toHaveBeenCalled();
  });
});
