import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export const GENERIC_API_ERROR_MESSAGE = 'Ops! Parece que houve um problema. Tente novamente em instantes...';
const AUTO_DISMISS_MS = 6_000;

@Injectable({ providedIn: 'root' })
export class ErrorFeedbackService
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _message = signal<string | null>(null);
  private dismissTimer: number | null = null;

  public readonly message = this._message.asReadonly();

  constructor()
  {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  public showGenericError(): void
  {
    this.show(GENERIC_API_ERROR_MESSAGE);
  }

  public show(message: string): void
  {
    this.clearTimer();
    this._message.set(message);

    const win = this.document.defaultView;
    if (win) {
      this.dismissTimer = win.setTimeout(() => {
        this.dismissTimer = null;
        this._message.set(null);
      }, AUTO_DISMISS_MS);
    }
  }

  public dismiss(): void
  {
    this.clearTimer();
    this._message.set(null);
  }

  private clearTimer(): void
  {
    if (this.dismissTimer !== null) {
      this.document.defaultView?.clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
