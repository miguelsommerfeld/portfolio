import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { ResumeService } from '@services/resume.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { type Subscription, finalize } from 'rxjs';

type ResumeCardMode = 'options' | 'code';

function stripResumeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
}

function formatResumeCode(raw: string): string {
  const clean = stripResumeCode(raw);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

@Component({
  host: { '(document:keydown.escape)': 'onEscape()' },
  selector: 'app-resume-card',
  templateUrl: './resume-card.html',
})
export class ResumeCard
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly resumeService = inject(ResumeService);
  private readonly smoothScroll = inject(SmoothScrollService);

  private isTrackingOpen = false;
  private previousActiveElement: HTMLElement | null = null;
  private downloadSubscription: Subscription | null = null;

  protected readonly closeButtonRef = viewChild<ElementRef<HTMLButtonElement>>('closeButtonRef');
  protected readonly codeInputRef = viewChild<ElementRef<HTMLInputElement>>('codeInputRef');

  protected readonly isOpen = this.resumeService.isCardOpen;
  protected readonly mode = signal<ResumeCardMode>('options');
  protected readonly accessCode = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isCodeComplete = computed(() => stripResumeCode(this.accessCode()).length === 8);

  constructor()
  {
    effect(() => {
      if (this.authService.pendingResumeAccess()) {
        this.authService.clearPendingResumeAccess();
        this.resumeService.openCard();
      }
    });

    effect(() => {
      if (this.isOpen()) {
        this.onOpened();
      } else {
        this.onClosed();
      }
    });

    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      const codeInput = this.codeInputRef()?.nativeElement;
      if (this.mode() === 'code' && codeInput) {
        codeInput.focus({ preventScroll: true });
        return;
      }

      const closeButton = this.closeButtonRef()?.nativeElement;
      if (this.mode() === 'options' && closeButton) {
        closeButton.focus({ preventScroll: true });
      }
    });

    this.destroyRef.onDestroy(() => this.onClosed(false));
  }

  protected onClose(): void
  {
    this.resumeService.closeCard();
  }

  protected onEscape(): void
  {
    if (this.isOpen()) {
      this.resumeService.closeCard();
    }
  }

  protected onBackdropClick(event: MouseEvent): void
  {
    if (event.target === event.currentTarget) {
      this.resumeService.closeCard();
    }
  }

  protected onPreventBackgroundScroll(event: Event): void
  {
    event.preventDefault();
  }

  protected onSelectCensored(): void
  {
    this.downloadResume();
  }

  protected onSelectSensitive(): void
  {
    if (this.isLoading()) {
      return;
    }

    this.errorMessage.set(null);
    this.mode.set('code');
  }

  protected onBackToOptions(): void
  {
    this.cancelDownload();
    this.errorMessage.set(null);
    this.accessCode.set('');
    this.mode.set('options');
  }

  protected onCodeInput(event: Event): void
  {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const formatted = formatResumeCode(input.value);
    input.value = formatted;
    this.accessCode.set(formatted);

    if (this.errorMessage()) {
      this.errorMessage.set(null);
    }
  }

  protected onSubmitCode(event: Event): void
  {
    event.preventDefault();

    if (!this.isCodeComplete() || this.isLoading()) {
      return;
    }

    this.downloadResume(this.accessCode());
  }

  private downloadResume(code?: string): void
  {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.downloadSubscription = this.resumeService
      .fetchResumePdf(code)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.downloadSubscription = null;
        }),
      )
      .subscribe({
        next: (pdfBlob) => {
          this.resumeService.openPdf(pdfBlob);
          this.resumeService.closeCard();
        },
        error: (error: unknown) => this.handleDownloadError(error),
      });
  }

  private handleDownloadError(error: unknown): void
  {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.resumeService.closeCard();
        this.authService.handleUnauthorized(true);
        return;
      }

      if (error.status === 403) {
        this.errorMessage.set('Código inválido ou expirado. Verifique e tente novamente.');
        return;
      }
    }

    this.errorMessage.set(GENERIC_API_ERROR_MESSAGE);
  }

  private onOpened(): void
  {
    if (this.isTrackingOpen) {
      return;
    }

    const active = this.document.activeElement;
    this.previousActiveElement = active instanceof HTMLElement ? active : null;
    this.smoothScroll.cancelMomentum();
    this.isTrackingOpen = true;
  }

  private onClosed(restoreFocus = true): void
  {
    this.cancelDownload();
    this.mode.set('options');
    this.accessCode.set('');
    this.errorMessage.set(null);

    if (!this.isTrackingOpen) {
      return;
    }

    this.isTrackingOpen = false;

    if (restoreFocus && this.previousActiveElement?.isConnected) {
      this.previousActiveElement.focus({ preventScroll: true });
    }

    this.previousActiveElement = null;
  }

  private cancelDownload(): void
  {
    if (this.downloadSubscription) {
      this.downloadSubscription.unsubscribe();
      this.downloadSubscription = null;
    }

    this.isLoading.set(false);
  }
}
