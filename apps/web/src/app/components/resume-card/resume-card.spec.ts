import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@services/auth.service';
import { ResumeService } from '@services/resume.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { Subject, of, throwError } from 'rxjs';
import { ResumeCard } from './resume-card';

describe('ResumeCard', () => {
  let isCardOpenSignal: ReturnType<typeof signal<boolean>>;
  let pendingResumeAccessSignal: ReturnType<typeof signal<boolean>>;
  let openCardSpy: ReturnType<typeof vi.fn>;
  let closeCardSpy: ReturnType<typeof vi.fn>;
  let fetchResumePdfSpy: ReturnType<typeof vi.fn>;
  let openPdfSpy: ReturnType<typeof vi.fn>;
  let handleUnauthorizedSpy: ReturnType<typeof vi.fn>;
  let clearPendingResumeAccessSpy: ReturnType<typeof vi.fn>;
  let cancelMomentumSpy: ReturnType<typeof vi.fn>;
  let doc: Document;

  beforeEach(async () => {
    isCardOpenSignal = signal(false);
    pendingResumeAccessSignal = signal(false);
    openCardSpy = vi.fn(() => isCardOpenSignal.set(true));
    closeCardSpy = vi.fn(() => isCardOpenSignal.set(false));
    fetchResumePdfSpy = vi.fn();
    openPdfSpy = vi.fn();
    handleUnauthorizedSpy = vi.fn();
    clearPendingResumeAccessSpy = vi.fn(() => pendingResumeAccessSignal.set(false));
    cancelMomentumSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ResumeCard],
      providers: [
        {
          provide: ResumeService,
          useValue: {
            isCardOpen: isCardOpenSignal.asReadonly(),
            openCard: openCardSpy,
            closeCard: closeCardSpy,
            fetchResumePdf: fetchResumePdfSpy,
            openPdf: openPdfSpy,
          },
        },
        {
          provide: AuthService,
          useValue: {
            pendingResumeAccess: pendingResumeAccessSignal.asReadonly(),
            clearPendingResumeAccess: clearPendingResumeAccessSpy,
            handleUnauthorized: handleUnauthorizedSpy,
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

  it('should automatically open when AuthService signals pending post-auth resume access', async () => {
    const fixture = TestBed.createComponent(ResumeCard);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();

    pendingResumeAccessSignal.set(true);
    await fixture.whenStable();

    expect(clearPendingResumeAccessSpy).toHaveBeenCalledTimes(1);
    expect(openCardSpy).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('should open censored resume PDF when user chooses "Currículo sem dados sensíveis"', async () => {
    const pdfBlob = new Blob(['%PDF-censored'], { type: 'application/pdf' });
    fetchResumePdfSpy.mockReturnValue(of(pdfBlob));
    isCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(ResumeCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const buttons = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button'));
    const censoredButton = buttons.find((button) => button.textContent?.trim() === 'Currículo sem dados sensíveis');

    expect(censoredButton).toBeTruthy();
    expect(cancelMomentumSpy).toHaveBeenCalledTimes(1);
    expect(doc.body.style.overflow).toBe('');

    censoredButton?.click();
    await fixture.whenStable();

    expect(fetchResumePdfSpy).toHaveBeenCalledWith(undefined);
    expect(openPdfSpy).toHaveBeenCalledWith(pdfBlob);
    expect(closeCardSpy).toHaveBeenCalledTimes(1);
  });

  it('should show 8-character code input for sensitive resume, format code, and submit with x-resume-code', async () => {
    const pdfBlob = new Blob(['%PDF-full'], { type: 'application/pdf' });
    fetchResumePdfSpy.mockReturnValue(of(pdfBlob));
    isCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(ResumeCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const sensitiveButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Currículo com dados sensíveis',
    );
    sensitiveButton?.click();
    await fixture.whenStable();

    const input = compiled.querySelector<HTMLInputElement>('#resume-access-code');
    const submitButton = compiled.querySelector<HTMLButtonElement>('button[type="submit"]');

    expect(input).toBeTruthy();
    expect(submitButton?.disabled).toBe(true);

    input!.value = 'a1b2c3d4';
    input!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(input?.value).toBe('A1B2-C3D4');
    expect(submitButton?.disabled).toBe(false);

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fetchResumePdfSpy).toHaveBeenCalledWith('A1B2-C3D4');
    expect(openPdfSpy).toHaveBeenCalledWith(pdfBlob);
    expect(closeCardSpy).toHaveBeenCalledTimes(1);
  });

  it('should display an inline error when API returns 403 for invalid code', async () => {
    fetchResumePdfSpy.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' })));
    isCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(ResumeCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const sensitiveButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Currículo com dados sensíveis',
    );
    sensitiveButton?.click();
    await fixture.whenStable();

    const input = compiled.querySelector<HTMLInputElement>('#resume-access-code');
    input!.value = 'FFFF-0000';
    input!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    compiled.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const alert = compiled.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Código inválido ou expirado');
    expect(closeCardSpy).not.toHaveBeenCalled();
  });

  it('should close card and reopen AuthCard with post-auth intent when API returns 401', async () => {
    fetchResumePdfSpy.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })));
    isCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(ResumeCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const censoredButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Currículo sem dados sensíveis',
    );
    censoredButton?.click();
    await fixture.whenStable();

    expect(closeCardSpy).toHaveBeenCalledTimes(1);
    expect(handleUnauthorizedSpy).toHaveBeenCalledWith(true);
  });

  it('should cancel in-flight download and reset state when closing via Escape or backdrop', async () => {
    const pending$ = new Subject<Blob>();
    fetchResumePdfSpy.mockReturnValue(pending$.asObservable());
    isCardOpenSignal.set(true);

    const fixture = TestBed.createComponent(ResumeCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const censoredButton = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Currículo sem dados sensíveis',
    );
    censoredButton?.click();
    await fixture.whenStable();

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    pending$.next(new Blob(['%PDF']));
    expect(openPdfSpy).not.toHaveBeenCalled();
  });
});
