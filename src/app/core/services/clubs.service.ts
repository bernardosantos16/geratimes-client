import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ClubResponseDTO,
  CreateClubRequestDTO,
  UpdateClubRequestDTO,
  ClubMemberResponseDTO,
  AddClubMemberRequestDTO,
  UpdateClubMemberRequestDTO,
  PageClubMemberResponseDTO,
  ClubJerseyResponseDTO,
  AddJerseyRequestDTO,
  UpdateJerseyRequestDTO,
  PageableParams,
} from '../models/api.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClubsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/clubs`;

  // ── Clubs ─────────────────────────────────────────────────────────────────
  getClubs(memberRole?: string): Observable<ClubResponseDTO[]> {
    return this.http.get<ClubResponseDTO[]>(`${this.baseUrl}?clubRole=${memberRole}`);
  }

  getClub(id: string): Observable<ClubResponseDTO> {
    return this.http.get<ClubResponseDTO>(`${this.baseUrl}/${id}`);
  }

  createClub(dto: CreateClubRequestDTO): Observable<ClubResponseDTO> {
    return this.http.post<ClubResponseDTO>(this.baseUrl, dto);
  }

  updateClub(id: string, dto: UpdateClubRequestDTO): Observable<ClubResponseDTO> {
    return this.http.put<ClubResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  deleteClub(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ── Members ───────────────────────────────────────────────────────────────
  getMembers(clubId: string, params?: PageableParams): Observable<PageClubMemberResponseDTO> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<PageClubMemberResponseDTO>(`${this.baseUrl}/${clubId}/members`, {
      params: httpParams,
    });
  }

  addMember(clubId: string, dto: AddClubMemberRequestDTO): Observable<ClubMemberResponseDTO> {
    return this.http.post<ClubMemberResponseDTO>(`${this.baseUrl}/${clubId}/members`, dto);
  }

  updateMember(
    clubId: string,
    memberId: number,
    dto: UpdateClubMemberRequestDTO
  ): Observable<ClubMemberResponseDTO> {
    return this.http.patch<ClubMemberResponseDTO>(
      `${this.baseUrl}/${clubId}/members/${memberId}`,
      dto
    );
  }

  removeMember(clubId: string, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${clubId}/members/${memberId}`);
  }

  // ── Jerseys ───────────────────────────────────────────────────────────────
  getJerseys(clubId: string): Observable<ClubJerseyResponseDTO[]> {
    return this.http.get<ClubJerseyResponseDTO[]>(`${this.baseUrl}/${clubId}/jerseys`);
  }

  addJersey(clubId: string, dto: AddJerseyRequestDTO): Observable<ClubJerseyResponseDTO> {
    return this.http.post<ClubJerseyResponseDTO>(`${this.baseUrl}/${clubId}/jerseys`, dto);
  }

  updateJersey(
    clubId: string,
    jerseyId: number,
    dto: UpdateJerseyRequestDTO
  ): Observable<ClubJerseyResponseDTO> {
    return this.http.put<ClubJerseyResponseDTO>(
      `${this.baseUrl}/${clubId}/jerseys/${jerseyId}`,
      dto
    );
  }

  deleteJersey(clubId: string, jerseyId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${clubId}/jerseys/${jerseyId}`);
  }
}
