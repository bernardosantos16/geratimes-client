import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateUserRequestDTO,
  UserResponseDTO,
  PageUserResponseDTO,
  PageableParams,
} from '../models/api.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  getUsers(params?: PageableParams): Observable<PageUserResponseDTO> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page);
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size);
    return this.http.get<PageUserResponseDTO>(this.baseUrl, { params: httpParams });
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

  verifyEmail(token: string): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/verify-email`, {
      params: new HttpParams().set('token', token),
    });
  }
}
