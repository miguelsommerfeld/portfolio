import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@config/api.config';
import { AuthService, type AuthMeResponse, type AuthProvider } from '@services/auth.service';
import { GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { Subject, of, throwError } from 'rxjs';
import { AuthCard } from './auth-card';

describe('AuthCard', () => {
  let isAuthCardOpenSignal: ReturnType<typeof signal<boolean>>;
  let closeAuthCardSpy: ReturnType<typeof vi.fn>;
  let verifySessionSpy: ReturnType<typeof vi.fn>;
  let redirectToOAuthSpy: ReturnType<typeof vi.fn>;
  let activatePendingResumeSpy: ReturnType<typeof vi.fn>;
  let cancelMomentumSpy: ReturnType<typeof vi.fn>;
  let doc: Document;

  beforeEach(async () => {
    isAuthCardOpenSignal = signal(false);
    closeAuthCardSpy = vi.fn(() => isAuthCardOpenSignal.set(false));
    verifySessionSpy = vi.fn();
    redirectToOAuthSpy = vi.fn();
    activatePendingResumeSpy = vi.fn();
    cancelMomentumSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AuthCard],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthCardOpen: isAuthCardOpenSignal.asReadonly(),
            closeAuthCard: closeAuthCardSpy,
            verifySession: verifySessionSpy,
            redirectToOAuth: redirectToOAuthSpy,
            activatePendingResumeIfSaved: activatePendingResumeSpy,
            getOAuthUrl: (provider: AuthProvider) => `${API_BASE_URL}/auth/${provider}`,
          },
        },
        {
          provide: SmoothScrollService,
          useValue: {
            cancelMomentum: cancelMomentumSpy,
          },
        },
      ],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render the dialog when closed', async () => {
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
    expect(cancelMomentumSpy).not.toHaveBeenCalled();
  });

  it('should render the centered liquid glass dialog with Google and GitHub OAuth links without mutating body overflow', async () => {
    isAuthCardOpenSignal.set(true);
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const dialog = compiled.querySelector<HTMLElement>('[role="dialog"]');
    const links = Array.from(compiled.querySelectorAll<HTMLAnchorElement>('a'));
    const googleLink = links.find((link) => link.getAttribute('href') === `${API_BASE_URL}/auth/google`);
    const githubLink = links.find((link) => link.getAttribute('href') === `${API_BASE_URL}/auth/github`);
    const googleIcon = googleLink?.querySelector<HTMLImageElement>('img');
    const githubIcon = githubLink?.querySelector<HTMLImageElement>('img');

    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('auth-card-title');
    expect(dialog?.className).toContain('rounded-3xl');
    expect(dialog?.className).toContain('backdrop-blur-2xl');

    expect(links.length).toBe(2);
    expect(googleLink?.textContent).toContain('Continuar com Google');
    expect(googleIcon?.getAttribute('src')).toBe('/icons/google.png');
    expect(googleIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(googleIcon?.className).not.toContain('invert');

    expect(githubLink?.textContent).toContain('Continuar com GitHub');
    expect(githubIcon?.getAttribute('src')).toBe('/icons/github.png');
    expect(githubIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(githubIcon?.className).toContain('invert');

    expect(cancelMomentumSpy).toHaveBeenCalledTimes(1);
    expect(doc.body.style.overflow).toBe('');
  });

  it('should redirect to OAuth provider when GET /auth/me confirms API is reachable with 401', async () => {
    verifySessionSpy.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })));
    isAuthCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const googleLink = compiled.querySelector<HTMLAnchorElement>(`a[href="${API_BASE_URL}/auth/google"]`);
    googleLink?.click();
    await fixture.whenStable();

    expect(verifySessionSpy).toHaveBeenCalledTimes(1);
    expect(redirectToOAuthSpy).toHaveBeenCalledWith('google');
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
  });

  it('should display a generic inline error when API is unreachable instead of redirecting', async () => {
    verifySessionSpy.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error', error: { message: 'ECONNREFUSED' } })),
    );
    isAuthCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const githubLink = compiled.querySelector<HTMLAnchorElement>(`a[href="${API_BASE_URL}/auth/github"]`);
    githubLink?.click();
    await fixture.whenStable();

    const alert = compiled.querySelector('[role="alert"]');
    expect(redirectToOAuthSpy).not.toHaveBeenCalled();
    expect(alert?.textContent?.trim()).toBe(GENERIC_API_ERROR_MESSAGE);
    expect(alert?.textContent).not.toContain('ECONNREFUSED');
  });

  it('should activate pending resume access without redirecting if session is already valid', async () => {
    verifySessionSpy.mockReturnValue(
      of({
        user: { sub: '1', email: 'miguel@example.com', name: 'Miguel', provider: 'google' },
      } satisfies AuthMeResponse),
    );
    isAuthCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLAnchorElement>(`a[href="${API_BASE_URL}/auth/google"]`)?.click();
    await fixture.whenStable();

    expect(activatePendingResumeSpy).toHaveBeenCalledTimes(1);
    expect(redirectToOAuthSpy).not.toHaveBeenCalled();
  });

  it('should cancel in-flight reachability check when closing the card', async () => {
    const pending$ = new Subject<AuthMeResponse>();
    verifySessionSpy.mockReturnValue(pending$.asObservable());
    isAuthCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLAnchorElement>(`a[href="${API_BASE_URL}/auth/google"]`)?.click();
    await fixture.whenStable();

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    pending$.error(new HttpErrorResponse({ status: 401 }));
    expect(redirectToOAuthSpy).not.toHaveBeenCalled();
  });

  it('should close when clicking the close button', async () => {
    isAuthCardOpenSignal.set(true);
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();

    const closeButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Fechar janela de autenticação"]',
    );

    expect(closeButton).toBeTruthy();
    closeButton?.click();
    await fixture.whenStable();

    expect(closeAuthCardSpy).toHaveBeenCalledTimes(1);
  });

  it('should close when clicking the backdrop but ignore clicks inside the card', async () => {
    isAuthCardOpenSignal.set(true);
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const dialog = compiled.querySelector<HTMLElement>('[data-testid="auth-card"]');
    const backdrop = compiled.querySelector<HTMLElement>('[data-testid="auth-card-backdrop"]');

    dialog?.click();
    expect(closeAuthCardSpy).not.toHaveBeenCalled();

    backdrop?.click();
    expect(closeAuthCardSpy).toHaveBeenCalledTimes(1);
  });

  it('should close on Escape key only when open', async () => {
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeAuthCardSpy).not.toHaveBeenCalled();

    isAuthCardOpenSignal.set(true);
    await fixture.whenStable();

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeAuthCardSpy).toHaveBeenCalledTimes(1);
  });
});
