import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClubContextService {
  private readonly _selectedClubId = signal<string | null>(null);
  private readonly _selectedClubRole = signal<'DIRECTOR' | 'MEMBER' | null>(null);

  readonly selectedClubId = this._selectedClubId.asReadonly();
  readonly selectedClubRole = this._selectedClubRole.asReadonly();

  setClubContext(clubId: string, role: 'DIRECTOR' | 'MEMBER'): void {
    this._selectedClubId.set(clubId);
    this._selectedClubRole.set(role);
  }

  clearClubContext(): void {
    this._selectedClubId.set(null);
    this._selectedClubRole.set(null);
  }
}
