import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@config/api.config';
import { AuthService, type AuthUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const mockUser: AuthUser = {
    sub: '12345',
    email: 'miguel@example.com',
    name: 'Miguel L. Sommerfeld',
    provider: 'github',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should populate user when GET /auth/me succeeds', () => {
    service.checkSession();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush({ user: mockUser });

    expect(service.user()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear user when GET /auth/me returns 401', () => {
    service.checkSession();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    req.flush({ error: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should call POST /auth/logout with credentials, prevent duplicate clicks, and clear user on 204', () => {
    service.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser });

    service.logout();
    service.logout();

    expect(service.isLoggingOut()).toBe(true);

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);

    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.isLoggingOut()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
