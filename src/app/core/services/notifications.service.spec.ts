import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NotificationsService } from './notifications.service';
import { PageNotificationResponseDTO } from '../models/api.models';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpTesting: HttpTestingController;
  const base = 'https://api.geniofc.com.br/api/notifications';
  const emptyPage: PageNotificationResponseDTO = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 100,
    first: true,
    last: true,
    empty: true,
    numberOfElements: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpTesting.verify(); });

  it('should list all notifications via GET with unread=false', () => {
    service.list(false, { size: 100 }).subscribe();
    const req = httpTesting.expectOne(
      (r) => r.url === base && r.params.get('unread') === 'false'
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyPage);
  });

  it('should list unread notifications via GET with unread=true', () => {
    service.list(true).subscribe();
    const req = httpTesting.expectOne(
      (r) => r.url === base && r.params.get('unread') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyPage);
  });

  it('should mark notification as read via PATCH', () => {
    service.markRead(12).subscribe();
    const req = httpTesting.expectOne(`${base}/12/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });
});
