import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { EditMemberModalComponent, SaveMemberEvent } from './edit-member-modal.component';

const MEMBER: ClubMemberResponseDTO = {
  id: 1, name: 'João', rating: 4, timesMvp: 2, timesChampion: 3,
  clubRole: 'MEMBER', isOwner: false
};

describe('EditMemberModalComponent', () => {
  let fixture: ComponentFixture<EditMemberModalComponent>;
  let component: EditMemberModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditMemberModalComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EditMemberModalComponent);
    component = fixture.componentInstance;
    component.member = MEMBER;
  });

  it('should patch form values on init', () => {
    fixture.detectChanges();
    expect(component.form.value).toEqual({
      name: 'João', rating: 4, timesMvp: 2, timesChampion: 3,
    });
  });

  it('should emit save with form raw value', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.btn-primary'));
    btn.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledWith({
      name: 'João', rating: 4, timesMvp: 2, timesChampion: 3,
    } as SaveMemberEvent);
  });

  it('should emit delete when button clicked', () => {
    const spy = vi.fn();
    component.delete.subscribe(spy);
    component.isDirector = false;
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('.btn-danger'));
    btn.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit dismiss on backdrop click', () => {
    const spy = vi.fn();
    component.dismiss.subscribe(spy);
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
    backdrop.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit dismiss on close button click', () => {
    const spy = vi.fn();
    component.dismiss.subscribe(spy);
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.modal-close'));
    closeBtn.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should hide delete button when isDirector is true', () => {
    component.isDirector = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.btn-danger'));
    expect(btn).toBeNull();
  });

  it('should hide promote button when canPromote is false', () => {
    component.canPromote = false;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.btn-outline'))).toBeNull();
  });

  it('should show promote button when canPromote is true', () => {
    component.canPromote = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.btn-outline'));
    expect(btn).toBeTruthy();
    expect(btn.nativeElement.textContent.trim()).toBe('Tornar diretor');
  });

  it('should hide demote button when canDemote is false', () => {
    component.canDemote = false;
    fixture.detectChanges();
    const demoteBtn = fixture.debugElement.queryAll(By.css('.btn-cancel'))
      .find(b => b.nativeElement.textContent.trim() === 'Rebaixar a membro');
    expect(demoteBtn).toBeUndefined();
  });

  it('should show demote button when canDemote is true', () => {
    component.canDemote = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.queryAll(By.css('.btn-cancel'))
      .find(b => b.nativeElement.textContent.trim() === 'Rebaixar a membro');
    expect(btn).toBeTruthy();
  });

  it('should emit promote when promote button clicked', () => {
    const spy = vi.fn();
    component.promote.subscribe(spy);
    component.canPromote = true;
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.btn-outline')).triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should emit demote when demote button clicked', () => {
    const spy = vi.fn();
    component.demote.subscribe(spy);
    component.canDemote = true;
    fixture.detectChanges();

    const btn = fixture.debugElement.queryAll(By.css('.btn-cancel'))
      .find(b => b.nativeElement.textContent.trim() === 'Rebaixar a membro');
    btn!.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledOnce();
  });
});
