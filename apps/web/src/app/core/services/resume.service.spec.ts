import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@config/api.config';
import { AuthService, type AuthUser } from '@services/auth.service';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { type ResumeCodeResponse, ResumeService } from './resume.service';

describe('ResumeService', () => {
  let service: ResumeService;
  let authService: AuthService;
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

    service = TestBed.inject(ResumeService);
    authService = TestBed.inject(AuthService);
    errorFeedback = TestBed.inject(ErrorFeedbackService);
    httpTesting = TestBed.inject(HttpTestingController);
    doc = TestBed.inject(DOCUMENT);
    doc.defaultView?.sessionStorage.clear();
  });

  afterEach(() => {
    errorFeedback.dismiss();
    httpTesting.verify();
    doc.defaultView?.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('should open resume card when GET /auth/me confirms session', () => {
    service.requestResumeAccess();
    service.requestResumeAccess();

    expect(service.isCheckingAccess()).toBe(true);

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush({ user: mockUser, canAccessResumeCode: false });

    expect(service.isCheckingAccess()).toBe(false);
    expect(service.isCardOpen()).toBe(true);
    expect(authService.isAuthCardOpen()).toBe(false);
  });

  it('should open auth card with post-auth resume intent when GET /auth/me returns 401', () => {
    service.requestResumeAccess();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    req.flush({ error: 'UNAUTHORIZED', message: 'Authentication required.' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isCheckingAccess()).toBe(false);
    expect(service.isCardOpen()).toBe(false);
    expect(authService.isAuthCardOpen()).toBe(true);
    expect(errorFeedback.message()).toBeNull();
    expect(doc.defaultView?.sessionStorage.getItem('portfolio:post_auth_action')).toBe('open_resume');
  });

  it('should display generic error feedback when GET /auth/me fails due to network or server error', () => {
    service.requestResumeAccess();

    const req = httpTesting.expectOne(`${API_BASE_URL}/auth/me`);
    req.error(new ProgressEvent('error'));

    expect(service.isCheckingAccess()).toBe(false);
    expect(service.isCardOpen()).toBe(false);
    expect(authService.isAuthCardOpen()).toBe(false);
    expect(errorFeedback.message()).toBe(GENERIC_API_ERROR_MESSAGE);
  });

  it('should open code card only when user is authenticated with resume code permission', () => {
    service.openCodeCard();
    expect(service.isCodeCardOpen()).toBe(false);

    authService.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser, canAccessResumeCode: false });

    service.openCodeCard();
    expect(service.isCodeCardOpen()).toBe(false);

    authService.checkSession();
    httpTesting.expectOne(`${API_BASE_URL}/auth/me`).flush({ user: mockUser, canAccessResumeCode: true });

    service.openCard();
    expect(service.isCardOpen()).toBe(true);

    service.openCodeCard();
    expect(service.isCodeCardOpen()).toBe(true);
    expect(service.isCardOpen()).toBe(false);

    service.closeCodeCard();
    expect(service.isCodeCardOpen()).toBe(false);
  });

  it('should request GET /resume/code with credentials', () => {
    const mockCode: ResumeCodeResponse = {
      code: 'A1B2-C3D4',
      validForDate: '2026-11-25',
      expiresAt: '2026-11-26T03:00:00.000Z',
    };
    let received: ResumeCodeResponse | undefined;

    service.fetchResumeCode().subscribe((response) => (received = response));

    const req = httpTesting.expectOne(`${API_BASE_URL}/resume/code`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockCode);

    expect(received).toEqual(mockCode);
  });

  it('should request GET /resume without header for censored variant and with x-resume-code for full variant', () => {
    let receivedBlob: Blob | undefined;
    service.fetchResumePdf().subscribe((blob) => (receivedBlob = blob));

    const censoredReq = httpTesting.expectOne(`${API_BASE_URL}/resume`);
    expect(censoredReq.request.method).toBe('GET');
    expect(censoredReq.request.withCredentials).toBe(true);
    expect(censoredReq.request.responseType).toBe('blob');
    expect(censoredReq.request.headers.has('x-resume-code')).toBe(false);
    censoredReq.flush(new Blob(['%PDF-censored'], { type: 'application/pdf' }));
    expect(receivedBlob).toBeInstanceOf(Blob);

    service.fetchResumePdf('A1B2-C3D4').subscribe();

    const fullReq = httpTesting.expectOne(`${API_BASE_URL}/resume`);
    expect(fullReq.request.headers.get('x-resume-code')).toBe('A1B2-C3D4');
    fullReq.flush(new Blob(['%PDF-full'], { type: 'application/pdf' }));
  });

  it('should open PDF via window.open and fall back to temporary link when popup is blocked', () => {
    const win = doc.defaultView!;
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:resume-pdf');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const openSpy = vi.spyOn(win, 'open').mockReturnValue({} as Window);

    service.openPdf(new Blob(['%PDF'], { type: 'application/pdf' }));
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('blob:resume-pdf', '_blank', 'noopener,noreferrer');

    openSpy.mockReturnValue(null);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    service.openPdf(new Blob(['%PDF'], { type: 'application/pdf' }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
