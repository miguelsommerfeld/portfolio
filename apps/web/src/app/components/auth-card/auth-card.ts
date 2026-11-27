import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { AuthService, type AuthProvider } from '@services/auth.service';
import { GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { type Subscription, finalize } from 'rxjs';

@Component({
  host: { '(document:keydown.escape)': 'onEscape()' },
  selector: 'app-auth-card',
  templateUrl: './auth-card.html',
})
export class AuthCard
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly smoothScroll = inject(SmoothScrollService);

  private isTrackingOpen = false;
  private previousActiveElement: HTMLElement | null = null;
  private connectSubscription: Subscription | null = null;

  protected readonly closeButtonRef = viewChild<ElementRef<HTMLButtonElement>>('closeButtonRef');
  protected readonly isOpen = this.authService.isAuthCardOpen;
  protected readonly isConnecting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly googleAuthUrl = this.authService.getOAuthUrl('google');
  protected readonly githubAuthUrl = this.authService.getOAuthUrl('github');

  constructor()
  {
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

  protected onSelectProvider(event: MouseEvent, provider: AuthProvider): void
  {
    event.preventDefault();

    if (this.isConnecting()) {
      return;
    }

    this.isConnecting.set(true);
    this.errorMessage.set(null);

    this.connectSubscription = this.authService
      .verifySession()
      .pipe(
        finalize(() => {
          this.isConnecting.set(false);
          this.connectSubscription = null;
        }),
      )
      .subscribe({
        next: () => this.authService.activatePendingResumeIfSaved(),
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.authService.redirectToOAuth(provider);
            return;
          }

          this.errorMessage.set(GENERIC_API_ERROR_MESSAGE);
        },
      });
  }

  protected onClose(): void
  {
    this.authService.closeAuthCard();
  }

  protected onEscape(): void
  {
    if (this.isOpen()) {
      this.authService.closeAuthCard();
    }
  }

  protected onBackdropClick(event: MouseEvent): void
  {
    if (event.target === event.currentTarget) {
      this.authService.closeAuthCard();
    }
  }

  protected onPreventBackgroundScroll(event: Event): void
  {
    event.preventDefault();
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
    this.cancelConnectionCheck();
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

  private cancelConnectionCheck(): void
  {
    if (this.connectSubscription) {
      this.connectSubscription.unsubscribe();
      this.connectSubscription = null;
    }

    this.isConnecting.set(false);
  }
}
