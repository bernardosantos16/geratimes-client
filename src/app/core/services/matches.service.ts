import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {
  CreateMatchRequestDTO,
  MatchParticipantResponseDTO,
  MatchResponseDTO,
  PageableParams,
  PageMatchResponseDTO,
  SetMatchResultRequestDTO,
} from '../models/api.models';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/matches`;

  getMatches(params?: PageableParams): Observable<PageMatchResponseDTO> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    return this.http.get<PageMatchResponseDTO>(this.baseUrl, { params: httpParams });
  }

  getMatch(id: string): Observable<MatchResponseDTO> {
    return this.http.get<MatchResponseDTO>(`${this.baseUrl}/${id}`);
  }

  createMatch(dto: CreateMatchRequestDTO): Observable<MatchResponseDTO> {
    return this.http.post<MatchResponseDTO>(this.baseUrl, dto);
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
    let httpParams = new HttpParams().set('clubId', clubId);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    return this.http.get<PageMatchResponseDTO>(this.baseUrl, { params: httpParams });
  }

  getMatchesByClubAndUpcoming(clubId: string, params?: PageableParams): Observable<PageMatchResponseDTO> {
    let httpParams = new HttpParams().set('clubId', clubId);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    return this.http.get<PageMatchResponseDTO>(`${this.baseUrl}/upcoming`, { params: httpParams });
  }
}
