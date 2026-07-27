import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateUserRequestDTO,
  UserResponseDTO,
  PageUserResponseDTO,
  PageableParams,
  SendEmailTokenRequestDTO,
  VerifyEmailRequestDTO,
  VerifyEmailResponseDTO,
} from '../models/api.models';
import { environment } from '../../../environments/environment';
import { buildPageableParams } from '../utils/http-params.utils';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  getUsers(params?: PageableParams): Observable<PageUserResponseDTO> {
    return this.http.get<PageUserResponseDTO>(this.baseUrl, { params: buildPageableParams(params) });
  }

  getUser(id: string): Observable<UserResponseDTO> {
    return this.http.get<UserResponseDTO>(`${this.baseUrl}/${id}`);
  }

  createUser(dto: CreateUserRequestDTO): Observable<UserResponseDTO> {
    return this.http.post<UserResponseDTO>(this.baseUrl, dto);
  }

  updateUser(id: string, dto: Partial<CreateUserRequestDTO>): Observable<UserResponseDTO> {
    return this.http.put<UserResponseDTO>(`${this.baseUrl}/${id}`, dto);
  }

  verifyEmail(dto: VerifyEmailRequestDTO): Observable<VerifyEmailResponseDTO> {
    return this.http.post<VerifyEmailResponseDTO>(`${this.baseUrl}/verify-email`, dto);
  }

  sendVerificationCode(login: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/email`, { login } as SendEmailTokenRequestDTO);
  }
}
