import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ClubResponseDTO,
    ClubMemberResponseDTO,
    ClubJerseyResponseDTO,
    MatchResponseDTO,
    ClubRole,
} from '@core/models/api.models';

@Injectable()
export class ClubDetailStore {
    readonly club = signal<ClubResponseDTO | null>(null);
    readonly members = signal<ClubMemberResponseDTO[]>([]);
    readonly jerseys = signal<ClubJerseyResponseDTO[]>([]);
    readonly matches = signal<MatchResponseDTO[]>([]);
    readonly userRole = signal<ClubRole | null>(null);
    readonly loading = signal(true);
    readonly clubId = signal<string>('');

    setClubId(id: string): void {
        this.clubId.set(id);
    }

    reset(): void {
        this.club.set(null);
        this.members.set([]);
        this.jerseys.set([]);
        this.matches.set([]);
        this.userRole.set(null);
        this.loading.set(true);
    }
}
