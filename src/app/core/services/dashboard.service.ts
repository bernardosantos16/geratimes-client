import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ClubsService } from './clubs.service';
import { MatchesService } from './matches.service';
import { ClubResponseDTO, MatchResponseDTO } from '../models/api.models';

export interface PendingMatchItem {
  match: MatchResponseDTO;
  clubName: string;
}

export interface RecentResultItem {
  match: MatchResponseDTO;
  clubName: string;
}

export interface DashboardData {
  ownerClubs: ClubResponseDTO[];
  memberClubs: ClubResponseDTO[];
  upcomingMatchesCount: number;
  completedMatchesCount: number;
  pendingMatches: PendingMatchItem[];
  recentResults: RecentResultItem[];
  upcomingMatches: RecentResultItem[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly clubsService = inject(ClubsService);
  private readonly matchesService = inject(MatchesService);

  loadDashboard(): Observable<DashboardData> {
    return forkJoin({
      directorClubs: this.clubsService.getClubs('DIRECTOR'),
      memberClubs: this.clubsService.getClubs('MEMBER'),
    }).pipe(
      switchMap(({ directorClubs, memberClubs }) => {
        const allClubs = [...directorClubs, ...memberClubs];

        return forkJoin({
          ownerClubs: of(directorClubs),
          memberClubs: of(memberClubs),
          pendingMatches: this.fetchPendingMatches(directorClubs),
          upcomingCounts: this.fetchUpcomingCounts(allClubs),
          recentResults: this.fetchRecentResults(allClubs),
          upcomingMatches: this.fetchUpcomingMatches(allClubs),
        });
      }),
      map((data) => ({
        ownerClubs: data.ownerClubs,
        memberClubs: data.memberClubs,
        pendingMatches: data.pendingMatches,
        upcomingMatchesCount: data.upcomingCounts,
        recentResults: data.recentResults.recent,
        completedMatchesCount: data.recentResults.totalCompleted,
        upcomingMatches: data.upcomingMatches,
      }))
    );
  }

  private fetchPendingMatches(clubs: ClubResponseDTO[]): Observable<PendingMatchItem[]> {
    if (clubs.length === 0) return of([]);
    return forkJoin(
      clubs.map((club) =>
        this.matchesService.matchesPendingResult(club.id).pipe(
          map((matches) => matches.map((m): PendingMatchItem => ({ match: m, clubName: club.name })))
        )
      )
    ).pipe(
      map((results) =>
        results
          .flat()
          .sort((a, b) => new Date(b.match.dateTime).getTime() - new Date(a.match.dateTime).getTime())
      )
    );
  }

  private fetchUpcomingCounts(clubs: ClubResponseDTO[]): Observable<number> {
    if (clubs.length === 0) return of(0);
    return forkJoin(
      clubs.map((club) =>
        this.matchesService.getMatchesByClubAndUpcoming(club.id, { size: 1 }).pipe(
          map((page) => page.totalElements)
        )
      )
    ).pipe(
      map((totals) => totals.reduce((sum, t) => sum + t, 0))
    );
  }

  private fetchRecentResults(clubs: ClubResponseDTO[]): Observable<{ recent: RecentResultItem[]; totalCompleted: number }> {
    if (clubs.length === 0) return of({ recent: [], totalCompleted: 0 });
    const now = new Date();
    return forkJoin(
      clubs.map((club) =>
        this.matchesService.getMatchesByClub(club.id, { size: 15, sort: 'dateTime,desc' }).pipe(
          map((page) => {
            let total = 0;
            const results: RecentResultItem[] = [];
            for (const match of page.content) {
              if (new Date(match.dateTime) < now) {
                total++;
                if (match.teamChampionId != null) {
                  results.push({ match, clubName: club.name });
                }
              }
            }
            return { results, total };
          })
        )
      )
    ).pipe(
      map((clubResults) => {
        const allResults = clubResults
          .flatMap((cr) => cr.results)
          .sort((a, b) => new Date(b.match.dateTime).getTime() - new Date(a.match.dateTime).getTime());
        return {
          recent: allResults.slice(0, 5),
          totalCompleted: clubResults.reduce((sum, cr) => sum + cr.total, 0),
        };
      })
    );
  }

  private fetchUpcomingMatches(clubs: ClubResponseDTO[]): Observable<RecentResultItem[]> {
    if (clubs.length === 0) return of([]);
    const now = new Date();
    return forkJoin(
      clubs.map((club) =>
        this.matchesService.getMatchesByClubAndUpcoming(club.id, { size: 5, sort: 'dateTime,asc' }).pipe(
          map((page) =>
            page.content
              .filter((m) => new Date(m.dateTime) >= now)
              .map((m): RecentResultItem => ({ match: m, clubName: club.name }))
          )
        )
      )
    ).pipe(
      map((results) =>
        results
          .flat()
          .sort((a, b) => new Date(a.match.dateTime).getTime() - new Date(b.match.dateTime).getTime())
          .slice(0, 5)
      )
    );
  }
}
