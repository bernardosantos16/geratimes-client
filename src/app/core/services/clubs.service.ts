import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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
  JoinClubRequestDTO,
  InviteTokenResponseDTO,
  ClubMembershipRequestResponseDTO,
  PageClubMembershipRequestResponseDTO,
  MembershipRequestStatus,
  PageableParams,
} from '../models/api.models';
import { environment } from '../../../environments/environment';
import { buildPageableParams } from '../utils/http-params.utils';

@Injectable({ providedIn: 'root' })
export class ClubsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/clubs`;

  // ── Clubs ─────────────────────────────────────────────────────────────────
  getClubs(memberRole?: string): Observable<ClubResponseDTO[]> {
    const params = memberRole ? new HttpParams().set('clubRole', memberRole) : undefined;
    return this.http.get<ClubResponseDTO[]>(this.baseUrl, { params });
  }

  getClubById(id: string): Observable<ClubResponseDTO> {
    return this.http.get<ClubResponseDTO>(`${this.baseUrl}/${id}`);
  }

  getClubByNickname(nickname: string): Observable<ClubResponseDTO> {
    return this.http.get<ClubResponseDTO>(`${this.baseUrl}/nickname/${nickname}`);
  }

  checkNicknameAvailable(nickname: string): Observable<boolean> {
    return this.http
      .get<{ available: boolean }>(`${this.baseUrl}/nickname/${nickname}/available`)
      .pipe(map((res) => res.available));
  }

  createClub(dto: CreateClubRequestDTO): Observable<ClubResponseDTO> {
    return this.http.post<ClubResponseDTO>(this.baseUrl, dto);
  }

  updateClub(id: string, dto: UpdateClubRequestDTO): Observable<ClubResponseDTO> {
    return this.http.patch<ClubResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  deleteClub(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  searchClubs(q: string): Observable<ClubResponseDTO[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<ClubResponseDTO[]>(`${this.baseUrl}/search`, { params });
  }

  // ── Membership ────────────────────────────────────────────────────────────
  joinClub(clubId: string, dto: JoinClubRequestDTO): Observable<ClubMembershipRequestResponseDTO> {
    return this.http.post<ClubMembershipRequestResponseDTO>(`${this.baseUrl}/${clubId}/invite`, dto);
  }

  generateInviteToken(clubId: string): Observable<InviteTokenResponseDTO> {
    return this.http.post<InviteTokenResponseDTO>(`${this.baseUrl}/${clubId}/invite-token`, null);
  }

  getInviteToken(clubId: string): Observable<InviteTokenResponseDTO> {
    return this.http.get<InviteTokenResponseDTO>(`${this.baseUrl}/${clubId}/invite-token`);
  }

  getMembershipRequests(
    clubId: string,
    status?: MembershipRequestStatus,
    params?: PageableParams
  ): Observable<PageClubMembershipRequestResponseDTO> {
    let httpParams = buildPageableParams(params);
    if (status) httpParams = httpParams.set('status', status);
    return this.http.get<PageClubMembershipRequestResponseDTO>(
      `${this.baseUrl}/${clubId}/membership-requests`,
      { params: httpParams }
    );
  }

  approveMembershipRequest(
    clubId: string,
    requestId: number
  ): Observable<ClubMembershipRequestResponseDTO> {
    return this.http.post<ClubMembershipRequestResponseDTO>(
      `${this.baseUrl}/${clubId}/membership-requests/${requestId}/approve`,
      null
    );
  }

  rejectMembershipRequest(
    clubId: string,
    requestId: number
  ): Observable<ClubMembershipRequestResponseDTO> {
    return this.http.post<ClubMembershipRequestResponseDTO>(
      `${this.baseUrl}/${clubId}/membership-requests/${requestId}/reject`,
      null
    );
  }

  // ── Members ───────────────────────────────────────────────────────────────
  getMembers(clubId: string, params?: PageableParams): Observable<PageClubMemberResponseDTO> {
    return this.http.get<PageClubMemberResponseDTO>(`${this.baseUrl}/${clubId}/members`, {
      params: buildPageableParams(params),
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
