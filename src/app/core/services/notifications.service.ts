import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageNotificationResponseDTO, PageableParams } from '../models/api.models';
import { environment } from '../../../environments/environment';
import { buildPageableParams } from '../utils/http-params.utils';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  list(unreadOnly = false, params?: PageableParams): Observable<PageNotificationResponseDTO> {
    let httpParams = buildPageableParams(params);
    httpParams = httpParams.set('unread', String(unreadOnly));
    return this.http.get<PageNotificationResponseDTO>(this.baseUrl, { params: httpParams });
  }

  markRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, null);
  }
}
