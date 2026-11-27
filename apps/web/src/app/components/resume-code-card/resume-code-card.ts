import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { type ResumeCodeResponse, ResumeService } from '@services/resume.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { type Subscription, finalize } from 'rxjs';

const COPY_FEEDBACK_DURATION_MS = 2000;

function formatValidForDate(validForDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(validForDate.trim());
  return match ? `${match[3]}/${match[2]}/${match[1]}` : validForDate;
}

function formatExpiresAt(expiresAt: string): string {
  const parsedDate = new Date(expiresAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return expiresAt;
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(parsedDate);
}

@Component({
  host: { '(document:keydown.escape)': 'onEscape()' },
  selector: 'app-resume-code-card',
  templateUrl: './resume-code-card.html',
})
export class ResumeCodeCard
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly resumeService = inject(ResumeService);
  private readonly errorFeedback = inject(ErrorFeedbackService);
  private readonly smoothScroll = inject(SmoothScrollService);

  private isTrackingOpen = false;
  private previousActiveElement: HTMLElement | null = null;
  private fetchSubscription: Subscription | null = null;
  private copyResetTimerId: number | null = null;

  protected readonly closeButtonRef = viewChild<ElementRef<HTMLButtonElement>>('closeButtonRef');

  protected readonly isOpen = this.resumeService.isCodeCardOpen;
  protected readonly codeData = signal<ResumeCodeResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isCopied = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly formattedValidForDate = computed(() => {
    const data = this.codeData();
    return data ? formatValidForDate(data.validForDate) : '';
  });
  protected readonly formattedExpiresAt = computed(() => {
    const data = this.codeData();
    return data ? formatExpiresAt(data.expiresAt) : '';
  });

  constructor()
  {
    effect(() => {
      if (!this.authService.isAuthenticated() || !this.authService.canAccessResumeCode()) {
        this.resumeService.closeCodeCard();
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
      const closeButton = this.closeButtonRef()?.nativeElement;
      if (this.isOpen() && closeButton) {
        closeButton.focus({ preventScroll: true });
      }
    });

    this.destroyRef.onDestroy(() => this.onClosed(false));
  }

  protected onClose(): void
  {
    this.resumeService.closeCodeCard();
  }

  protected onEscape(): void
  {
    if (this.isOpen()) {
      this.resumeService.closeCodeCard();
    }
  }

  protected onBackdropClick(event: MouseEvent): void
  {
    if (event.target === event.currentTarget) {
      this.resumeService.closeCodeCard();
    }
  }

  protected onPreventBackgroundScroll(event: Event): void
  {
    event.preventDefault();
  }

  protected onRetry(): void
  {
    this.loadCode();
  }

  protected async onCopyCode(): Promise<void>
  {
    const code = this.codeData()?.code;
    if (!code) {
      return;
    }

    const win = this.document.defaultView;
    const clipboard = win?.navigator?.clipboard;

    if (!win || !clipboard?.writeText) {
      this.errorMessage.set(GENERIC_API_ERROR_MESSAGE);
      return;
    }

    try {
      await clipboard.writeText(code);
      this.errorMessage.set(null);
      this.clearCopiedTimer();
      this.isCopied.set(true);
      this.copyResetTimerId = win.setTimeout(() => {
        this.isCopied.set(false);
        this.copyResetTimerId = null;
      }, COPY_FEEDBACK_DURATION_MS);
    } catch {
      this.errorMessage.set(GENERIC_API_ERROR_MESSAGE);
    }
  }

  private loadCode(): void
  {
    this.cancelFetch();
    this.clearCopiedState();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.fetchSubscription = this.resumeService
      .fetchResumeCode()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
          this.fetchSubscription = null;
        }),
      )
      .subscribe({
        next: (response) => this.codeData.set(response),
        error: (error: unknown) => this.handleFetchError(error),
      });
  }

  private handleFetchError(error: unknown): void
  {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        this.resumeService.closeCodeCard();
        this.authService.handleUnauthorized(false);
        return;
      }

      if (error.status === 403) {
        this.resumeService.closeCodeCard();
        this.authService.revokeResumeCodeAccess();
        this.errorFeedback.showGenericError();
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
    this.loadCode();
  }

  private onClosed(restoreFocus = true): void
  {
    this.cancelFetch();
    this.clearCopiedState();
    this.codeData.set(null);
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

  private cancelFetch(): void
  {
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
      this.fetchSubscription = null;
    }

    this.isLoading.set(false);
  }

  private clearCopiedState(): void
  {
    this.clearCopiedTimer();
    this.isCopied.set(false);
  }

  private clearCopiedTimer(): void
  {
    if (this.copyResetTimerId !== null) {
      this.document.defaultView?.clearTimeout(this.copyResetTimerId);
      this.copyResetTimerId = null;
    }
  }
}
