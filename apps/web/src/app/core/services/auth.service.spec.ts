import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@config/api.config';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { AuthService, type AuthUser } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let errorFeedback: ErrorFeedbackService;
  let httpTesting: HttpTestingController;
  let doc: Document;

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
    errorFeedback = TestBed.inject(ErrorFeedbackService);
    httpTesting = TestBed.inject(HttpTestingController);
    doc = TestBed.inject(DOCUMENT);
    doc.defaultView?.sessionStorage.clear();
  });

  afterEach(() => {
    errorFeedback.dismiss();
    httpTesting.verify();
    doc.defaultView?.sessionStorage.clear();
  });

  it('should populate user and close auth card when GET /auth/me succeeds', () => {
    service.openAuthCard();
    expect(service.isAuthCardOpen()).toBe(true);

    service.checkSession();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush({ user: mockUser });

    expect(service.user()).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAuthCardOpen()).toBe(false);
    expect(service.pendingResumeAccess()).toBe(false);
  });

  it('should consume post-auth resume intent and signal pendingResumeAccess after OAuth return', () => {
    service.handleUnauthorized(true);
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBe('open_resume');

    service.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser });

    expect(service.pendingResumeAccess()).toBe(true);
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBeNull();

    service.clearPendingResumeAccess();
    expect(service.pendingResumeAccess()).toBe(false);
  });

  it('should clear post-auth resume intent when closing auth card or opening from navbar', () => {
    service.handleUnauthorized(true);
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBe('open_resume');

    service.closeAuthCard();
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBeNull();

    service.handleUnauthorized(true);
    service.openAuthCard();
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBeNull();
  });

  it('should silently clear user and post-auth intent when initial checkSession fails', () => {
    service.handleUnauthorized(true);
    service.checkSession();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    req.error(new ProgressEvent('error'));

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBeNull();
    expect(errorFeedback.message()).toBeNull();
  });

  it('should open and close auth card only when unauthenticated', () => {
    expect(service.isAuthCardOpen()).toBe(false);

    service.openAuthCard();
    expect(service.isAuthCardOpen()).toBe(true);

    service.closeAuthCard();
    expect(service.isAuthCardOpen()).toBe(false);

    service.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser });

    service.openAuthCard();
    expect(service.isAuthCardOpen()).toBe(false);
  });

  it('should clear user and open auth card on handleUnauthorized', () => {
    service.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser });

    expect(service.isAuthenticated()).toBe(true);

    service.handleUnauthorized();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAuthCardOpen()).toBe(true);
  });

  it('should build OAuth URLs from API_BASE_URL', () => {
    expect(service.getOAuthUrl('google')).toBe(`${API_BASE_URL}/auth/google`);
    expect(service.getOAuthUrl('github')).toBe(`${API_BASE_URL}/auth/github`);
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
    expect(errorFeedback.message()).toBeNull();
  });

  it('should show generic error feedback when POST /auth/logout fails without exposing server details', () => {
    service.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser });

    service.logout();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/logout`);
    req.flush({ message: 'Internal database panic' }, { status: 500, statusText: 'Internal Server Error' });

    expect(service.isLoggingOut()).toBe(false);
    expect(service.isAuthenticated()).toBe(true);
    expect(errorFeedback.message()).toBe(GENERIC_API_ERROR_MESSAGE);
    expect(errorFeedback.message()).not.toContain('Internal database panic');
  });
});
