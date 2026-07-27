import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {
  BatchMatchRequestDTO,
  CreateMatchRequestDTO,
  MatchParticipantResponseDTO,
  MatchResponseDTO,
  PageableParams,
  PageMatchResponseDTO,
  SetMatchResultRequestDTO,
} from '../models/api.models';
import {environment} from '../../../environments/environment';
import { buildPageableParams } from '../utils/http-params.utils';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/matches`;

  getMatches(params?: PageableParams): Observable<PageMatchResponseDTO> {
    return this.http.get<PageMatchResponseDTO>(this.baseUrl, { params: buildPageableParams(params) });
  }

  getMatch(id: string): Observable<MatchResponseDTO> {
    return this.http.get<MatchResponseDTO>(`${this.baseUrl}/${id}`);
  }

  createMatch(dto: CreateMatchRequestDTO): Observable<MatchResponseDTO> {
    return this.http.post<MatchResponseDTO>(this.baseUrl, dto);
  }

  createBatchMatches(dto: BatchMatchRequestDTO): Observable<MatchResponseDTO[]> {
    return this.http.post<MatchResponseDTO[]>(`${this.baseUrl}/batch`, dto);
  }

  deleteMatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setResult(id: string, dto: SetMatchResultRequestDTO): Observable<MatchResponseDTO> {
    return this.http.patch<MatchResponseDTO>(`${this.baseUrl}/${id}/result`, dto);
  }

  getParticipants(matchId: string): Observable<MatchParticipantResponseDTO[]> {
    return this.http.get<MatchParticipantResponseDTO[]>(`${this.baseUrl}/${matchId}/participants`);
  }

  getMatchesByClub(clubId: string, params?: PageableParams): Observable<PageMatchResponseDTO> {
    const base = new HttpParams().set('clubId', clubId);
    return this.http.get<PageMatchResponseDTO>(this.baseUrl, { params: buildPageableParams(params, base) });
  }

  getMatchesByClubAndUpcoming(clubId: string, params?: PageableParams): Observable<PageMatchResponseDTO> {
    const base = new HttpParams().set('clubId', clubId);
    return this.http.get<PageMatchResponseDTO>(`${this.baseUrl}/upcoming`, { params: buildPageableParams(params, base) });
  }

  matchesPendingResult(clubId: string, size: number = 100): Observable<MatchResponseDTO[]> {
    const now = new Date();
    return this.getMatchesByClub(clubId, { size, sort: 'dateTime,desc' }).pipe(
        map((page) => page.content),
        map((matches) =>
          matches.filter(
            (match) =>
              new Date(match.dateTime) < now &&
              match.clubMemberMvpId === null &&
              match.teamChampionId === null
          )
        )
    );
  }
}
