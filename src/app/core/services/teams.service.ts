import { Injectable, inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTeamRequestDTO,
  TeamResponseDTO,
  UpdateTeamJerseyRequestDTO,
  GenerateTeamsRequestDTO,
  GenerateTeamsResponseDTO,
  SwapPlayersRequestDTO, PageTeamResponseDTO, PageDTO,
} from '../models/api.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/teams`;

  getTeam(id: number): Observable<TeamResponseDTO> {
    return this.http.get<TeamResponseDTO>(`${this.baseUrl}/${id}`);
  }

  getTeamsByMatch(matchId: string): Observable<PageDTO<TeamResponseDTO>> {
    const httpParams = new HttpParams().set('matchId', matchId);
    return this.http.get<PageDTO<TeamResponseDTO>>(this.baseUrl, { params: httpParams });
  }

  createTeam(dto: CreateTeamRequestDTO): Observable<TeamResponseDTO> {
    return this.http.post<TeamResponseDTO>(this.baseUrl, dto);
  }

  updateTeamJersey(id: number, dto: UpdateTeamJerseyRequestDTO): Observable<TeamResponseDTO> {
    return this.http.patch<TeamResponseDTO>(`${this.baseUrl}/${id}/jersey`, dto);
  }

  generateTeams(dto: GenerateTeamsRequestDTO): Observable<GenerateTeamsResponseDTO> {
    return this.http.post<GenerateTeamsResponseDTO>(`${this.baseUrl}/generate`, dto);
  }

  swapPlayers(dto: SwapPlayersRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/swap`, dto);
  }
}
