import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, effect, inject, viewChild } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';

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

  protected readonly closeButtonRef = viewChild<ElementRef<HTMLButtonElement>>('closeButtonRef');
  protected readonly isOpen = this.authService.isAuthCardOpen;
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
    if (!this.isTrackingOpen) {
      return;
    }

    this.isTrackingOpen = false;

    if (restoreFocus && this.previousActiveElement?.isConnected) {
      this.previousActiveElement.focus({ preventScroll: true });
    }

    this.previousActiveElement = null;
  }
}
