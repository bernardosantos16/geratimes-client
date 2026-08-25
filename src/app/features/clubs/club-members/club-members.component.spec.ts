import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ClubMembersComponent } from './club-members.component';
import { ClubsService } from '@core/services/clubs.service';
import { ToastService } from '@core/services/toast.service';
import { ClubDetailStore } from '@core/services/club-detail.store';
import { ClubMemberResponseDTO } from '@core/models/api.models';

function member(overrides: Partial<ClubMemberResponseDTO> = {}): ClubMemberResponseDTO {
  return {
    id: 1, name: 'João', rating: 4, timesMvp: 2, timesChampion: 3,
    clubRole: 'MEMBER', isOwner: false, ...overrides,
  };
}

describe('ClubMembersComponent', () => {
  let fixture: ComponentFixture<ClubMembersComponent>;
  let component: ClubMembersComponent;
  let clubsMock: any;
  let toastMock: any;
  let store: ClubDetailStore;

  beforeEach(async () => {
    clubsMock = {
      getMembers: vi.fn().mockReturnValue(of({ content: [member({ name: 'Zé' }), member({ id: 2, name: 'Ana' })], totalPages: 1, totalElements: 2, number: 0, size: 100 })),
      addMember: vi.fn(),
      updateMember: vi.fn(),
      removeMember: vi.fn(),
      promoteMember: vi.fn(),
      demoteMember: vi.fn(),
    };
    toastMock = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ClubMembersComponent],
      providers: [
        { provide: ClubsService, useValue: clubsMock },
        { provide: ToastService, useValue: toastMock },
        ClubDetailStore,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ClubMembersComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(ClubDetailStore);
    store.clubId.set('c1');
    fixture.detectChanges();
  });

  it('should load members on init', () => {
    expect(clubsMock.getMembers).toHaveBeenCalledWith('c1', { size: 100 });
    expect(store.members().length).toBe(2);
  });

  it('should sort members by name ascending', () => {
    store.members.set([member({ name: 'Zé' }), member({ id: 2, name: 'Ana' })]);
    component.sortField.set('name');
    component.sortDirection.set('asc');
    const sorted = component.sortedMembers();
    expect(sorted[0].name).toBe('Ana');
    expect(sorted[1].name).toBe('Zé');
  });

  it('should toggle sort direction when same field is clicked', () => {
    component.sortField.set('name');
    component.sortDirection.set('asc');

    component.setSort('name');

    expect(component.sortDirection()).toBe('desc');
  });

  it('should switch sort field and reset direction', () => {
    component.sortField.set('name');
    component.sortDirection.set('desc');

    component.setSort('rating');

    expect(component.sortField()).toBe('rating');
    expect(component.sortDirection()).toBe('asc');
  });

  it('should return sort indicator arrows', () => {
    component.sortField.set('name');
    component.sortDirection.set('asc');
    expect(component.sortIndicator('name')).toBe('▲');

    component.sortDirection.set('desc');
    expect(component.sortIndicator('name')).toBe('▼');

    expect(component.sortIndicator('rating')).toBe('');
  });

  it('should add member and update store', () => {
    const newMember = member({ id: 3, name: 'Novo' });
    clubsMock.addMember.mockReturnValue(of(newMember));
    component.memberForm.patchValue({ name: 'Novo', rating: 3 });

    component.addMember();

    expect(clubsMock.addMember).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Novo', rating: 3 }));
    expect(store.members()).toContainEqual(newMember);
    expect(toastMock.success).toHaveBeenCalledWith('Membro adicionado!');
  });

  it('should update member and replace in store', () => {
    const updated = member({ id: 2, name: 'Ana Atualizada', rating: 5 });
    clubsMock.updateMember.mockReturnValue(of(updated));
    store.members.set([member({ name: 'Zé' }), member({ id: 2, name: 'Ana' })]);
    component.editingMember.set(member({ id: 2 }));

    component.saveMemberChanges({ name: 'Ana Atualizada', rating: 5, timesMvp: 1, timesChampion: 0 });

    expect(clubsMock.updateMember).toHaveBeenCalledWith('c1', 2, expect.objectContaining({ name: 'Ana Atualizada' }));
    expect(store.members().find(m => m.id === 2)?.name).toBe('Ana Atualizada');
    expect(toastMock.success).toHaveBeenCalledWith('Membro atualizado!');
  });

  it('should remove member from store on delete', () => {
    clubsMock.removeMember.mockReturnValue(of(void 0));
    store.members.set([member({ name: 'Zé' }), member({ id: 2, name: 'Ana' })]);
    component['memberToDelete'].set(member({ id: 2 }));

    component.deleteSelectedMember();

    expect(clubsMock.removeMember).toHaveBeenCalledWith('c1', 2);
    expect(store.members().length).toBe(1);
    expect(toastMock.success).toHaveBeenCalledWith('Membro removido.');
  });

  it('should allow promote only for members with userId', () => {
    expect(component.canPromote(member({ userId: 'u1', clubRole: 'MEMBER' }))).toBe(true);
    expect(component.canPromote(member({ userId: null, clubRole: 'MEMBER' }))).toBe(false);
    expect(component.canPromote(member({ userId: 'u1', clubRole: 'DIRECTOR' }))).toBe(false);
  });

  it('should allow demote only for directors that are not owner', () => {
    expect(component.canDemote(member({ clubRole: 'DIRECTOR', isOwner: false }))).toBe(true);
    expect(component.canDemote(member({ clubRole: 'DIRECTOR', isOwner: true }))).toBe(false);
    expect(component.canDemote(member({ clubRole: 'MEMBER', isOwner: false }))).toBe(false);
  });

  it('should promote member and update store', () => {
    const target = member({ id: 2, name: 'Ana', clubRole: 'MEMBER' });
    clubsMock.promoteMember.mockReturnValue(of(void 0));
    store.members.set([member({ name: 'Zé' }), target]);
    component['memberToPromote'].set(target);

    component.promoteMember();

    expect(clubsMock.promoteMember).toHaveBeenCalledWith('c1', 2);
    expect(store.members().find(m => m.id === 2)?.clubRole).toBe('DIRECTOR');
    expect(toastMock.success).toHaveBeenCalledWith('Ana agora é diretor do clube.');
  });

  it('should demote member and update store', () => {
    const target = member({ id: 2, name: 'Ana', clubRole: 'DIRECTOR' });
    clubsMock.demoteMember.mockReturnValue(of(void 0));
    store.members.set([member({ name: 'Zé' }), target]);
    component['memberToDemote'].set(target);

    component.demoteMember();

    expect(clubsMock.demoteMember).toHaveBeenCalledWith('c1', 2);
    expect(store.members().find(m => m.id === 2)?.clubRole).toBe('MEMBER');
    expect(toastMock.success).toHaveBeenCalledWith('Ana agora é membro do clube.');
  });

  it('should show friendly message on 409 promote conflict', () => {
    clubsMock.promoteMember.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component['memberToPromote'].set(member({ id: 2, name: 'Ana' }));

    component.promoteMember();

    expect(toastMock.error).toHaveBeenCalledWith('Não é possível promover este membro.');
  });

  it('should show generic message on non-409 error', () => {
    clubsMock.demoteMember.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component['memberToDemote'].set(member({ id: 2, name: 'Ana', clubRole: 'DIRECTOR' }));

    component.demoteMember();

    expect(toastMock.error).toHaveBeenCalledWith('Erro ao rebaixar diretor.');
  });
});
