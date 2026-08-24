import { describe, it, expect, beforeEach } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { UsersService } from './users.service';
import { PageUserResponseDTO, UserResponseDTO } from '../models/api.models';

describe('UsersService', () => {
  let service: UsersService;
  let httpTesting: HttpTestingController;
  const base = 'https://api.geniofc.com.br/api/users';
  const user: UserResponseDTO = { id: 'u1', name: 'John', nickname: 'john', login: 'john@example.com' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpTesting.verify(); });

  it('should fetch users with pagination via GET', () => {
    const page: PageUserResponseDTO = { content: [user], totalElements: 1, totalPages: 1, number: 0, size: 15, first: true, last: true, empty: false, numberOfElements: 1 };
    service.getUsers({ page: 0, size: 15 }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === base && r.params.get('page') === '0');
    expect(req.request.params.get('size')).toBe('15');
    req.flush(page);
  });

  it('should fetch user by id via GET', () => {
    service.getUser('u1').subscribe();
    const req = httpTesting.expectOne(`${base}/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(user);
  });

  it('should create user via POST', () => {
    service.createUser({ name: 'New', nickname: 'new', password: '12345678', registrationToken: 'tok' }).subscribe();
    const req = httpTesting.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({ ...user, name: 'New' });
  });

  it('should update user via PUT', () => {
    service.updateUser('u1', { name: 'Updated' }).subscribe();
    const req = httpTesting.expectOne(`${base}/u1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Updated');
    req.flush({ ...user, name: 'Updated' });
  });

  it('should verify email via POST /verify-email', () => {
    service.verifyEmail({ login: 'john@example.com', token: '123456' }).subscribe();
    const req = httpTesting.expectOne(`${base}/verify-email`);
    expect(req.request.method).toBe('POST');
    req.flush({ registrationToken: 'reg-token' });
  });

  it('should send verification code via POST /email', () => {
    service.sendVerificationCode('john@example.com').subscribe();
    const req = httpTesting.expectOne(`${base}/email`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.login).toBe('john@example.com');
    req.flush(null);
  });
});
