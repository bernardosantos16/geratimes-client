import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClubMemberResponseDTO } from '@core/models/api.models';
import { EditMemberModalComponent, SaveMemberEvent } from './edit-member-modal.component';

const MEMBER: ClubMemberResponseDTO = {
  id: 1, name: 'João', rating: 4, timesMvp: 2, timesChampion: 3,
  clubRole: 'MEMBER', position: 'MEIA', clubId: 10,
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
});
