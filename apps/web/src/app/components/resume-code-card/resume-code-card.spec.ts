import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@services/auth.service';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { type ResumeCodeResponse, ResumeService } from '@services/resume.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { Subject, of, throwError } from 'rxjs';
import { ResumeCodeCard } from './resume-code-card';

describe('ResumeCodeCard', () => {
  let isCodeCardOpenSignal: ReturnType<typeof signal<boolean>>;
  let isAuthenticatedSignal: ReturnType<typeof signal<boolean>>;
  let canAccessResumeCodeSignal: ReturnType<typeof signal<boolean>>;
  let closeCodeCardSpy: ReturnType<typeof vi.fn>;
  let fetchResumeCodeSpy: ReturnType<typeof vi.fn>;
  let handleUnauthorizedSpy: ReturnType<typeof vi.fn>;
  let revokeResumeCodeAccessSpy: ReturnType<typeof vi.fn>;
  let showGenericErrorSpy: ReturnType<typeof vi.fn>;
  let cancelMomentumSpy: ReturnType<typeof vi.fn>;
  let doc: Document;

  const mockCodeResponse: ResumeCodeResponse = {
    code: 'A1B2-C3D4',
    validForDate: '2026-11-25',
    expiresAt: '2026-11-26T03:00:00.000Z',
  };

  beforeEach(async () => {
    isCodeCardOpenSignal = signal(false);
    isAuthenticatedSignal = signal(true);
    canAccessResumeCodeSignal = signal(true);
    closeCodeCardSpy = vi.fn(() => isCodeCardOpenSignal.set(false));
    fetchResumeCodeSpy = vi.fn(() => of(mockCodeResponse));
    handleUnauthorizedSpy = vi.fn();
    revokeResumeCodeAccessSpy = vi.fn(() => canAccessResumeCodeSignal.set(false));
    showGenericErrorSpy = vi.fn();
    cancelMomentumSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ResumeCodeCard],
      providers: [
        {
          provide: ResumeService,
          useValue: {
            isCodeCardOpen: isCodeCardOpenSignal.asReadonly(),
            closeCodeCard: closeCodeCardSpy,
            fetchResumeCode: fetchResumeCodeSpy,
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: isAuthenticatedSignal.asReadonly(),
            canAccessResumeCode: canAccessResumeCodeSignal.asReadonly(),
            handleUnauthorized: handleUnauthorizedSpy,
            revokeResumeCodeAccess: revokeResumeCodeAccessSpy,
          },
        },
        {
          provide: ErrorFeedbackService,
          useValue: {
            showGenericError: showGenericErrorSpy,
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
    doc.body.style.overflow = '';
  });

  afterEach(() => {
    doc.body.style.overflow = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should not render the modal when closed', async () => {
    const fixture = TestBed.createComponent(ResumeCodeCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
    expect(fetchResumeCodeSpy).not.toHaveBeenCalled();
  });

  it('should fetch and display formatted code information when opened without mutating body overflow', async () => {
    const codeSubject = new Subject<ResumeCodeResponse>();
    fetchResumeCodeSpy.mockReturnValueOnce(codeSubject.asObservable());

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="dialog"]')).toBeTruthy();
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('Carregando código diário...');
    expect(cancelMomentumSpy).toHaveBeenCalledTimes(1);
    expect(doc.body.style.overflow).toBe('');

    codeSubject.next(mockCodeResponse);
    codeSubject.complete();
    fixture.detectChanges();

    const expectedExpiresAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(mockCodeResponse.expiresAt),
    );

    expect(compiled.querySelector('[data-testid="resume-code-value"]')?.textContent?.trim()).toBe('A1B2-C3D4');
    expect(compiled.querySelector('[data-testid="resume-code-valid-date"]')?.textContent?.trim()).toBe('25/11/2026');
    expect(compiled.querySelector('[data-testid="resume-code-expires-at"]')?.textContent?.trim()).toBe(expectedExpiresAt);
  });

  it('should copy the code to clipboard and show temporary visual feedback', async () => {
    vi.useFakeTimers();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(doc.defaultView!.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextSpy },
    });

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const copyButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Copiar código'),
    );

    expect(copyButton).toBeTruthy();
    copyButton!.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(writeTextSpy).toHaveBeenCalledWith('A1B2-C3D4');
    expect(copyButton?.textContent).toContain('Código copiado!');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(copyButton?.textContent).toContain('Copiar código');
  });

  it('should show the generic inline error if copying to clipboard fails', async () => {
    const writeTextSpy = vi.fn().mockRejectedValue(new Error('Clipboard blocked'));
    Object.defineProperty(doc.defaultView!.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextSpy },
    });

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const copyButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Copiar código'),
    );

    copyButton!.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(compiled.querySelector('[role="alert"]')?.textContent?.trim()).toBe(GENERIC_API_ERROR_MESSAGE);
  });

  it('should close on backdrop click, Escape key, and close button while restoring focus without scrolling', async () => {
    const triggerButton = doc.createElement('button');
    doc.body.appendChild(triggerButton);
    triggerButton.focus();
    const focusSpy = vi.spyOn(triggerButton, 'focus');

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const backdrop = compiled.querySelector<HTMLElement>('[data-testid="resume-code-card-backdrop"]');
    const wheelEvent = new WheelEvent('wheel', { cancelable: true });
    backdrop!.dispatchEvent(wheelEvent);
    expect(wheelEvent.defaultPrevented).toBe(true);

    backdrop!.click();
    expect(closeCodeCardSpy).toHaveBeenCalledTimes(1);

    fixture.detectChanges();
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();
    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeCodeCardSpy).toHaveBeenCalledTimes(2);

    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('button[aria-label="Fechar código do currículo"]')!.click();
    expect(closeCodeCardSpy).toHaveBeenCalledTimes(3);

    triggerButton.remove();
  });

  it('should close and trigger handleUnauthorized when GET /resume/code returns 401', async () => {
    fetchResumeCodeSpy.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    expect(closeCodeCardSpy).toHaveBeenCalledTimes(1);
    expect(handleUnauthorizedSpy).toHaveBeenCalledWith(false);
  });

  it('should close, revoke code access, and show generic error when GET /resume/code returns 403', async () => {
    fetchResumeCodeSpy.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' })),
    );

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    expect(closeCodeCardSpy).toHaveBeenCalled();
    expect(revokeResumeCodeAccessSpy).toHaveBeenCalledTimes(1);
    expect(showGenericErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('should display a generic inline error and allow retry when GET /resume/code fails with server error', async () => {
    fetchResumeCodeSpy
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })))
      .mockReturnValueOnce(of(mockCodeResponse));

    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent?.trim()).toBe(GENERIC_API_ERROR_MESSAGE);

    const retryButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
      button.textContent?.includes('Tentar novamente'),
    );
    expect(retryButton).toBeTruthy();

    retryButton!.click();
    fixture.detectChanges();

    expect(fetchResumeCodeSpy).toHaveBeenCalledTimes(2);
    expect(compiled.querySelector('[data-testid="resume-code-value"]')?.textContent?.trim()).toBe('A1B2-C3D4');
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
  });

  it('should automatically close when user logs out', async () => {
    const fixture = TestBed.createComponent(ResumeCodeCard);
    isCodeCardOpenSignal.set(true);
    fixture.detectChanges();

    isAuthenticatedSignal.set(false);
    fixture.detectChanges();

    expect(closeCodeCardSpy).toHaveBeenCalled();
  });
});
