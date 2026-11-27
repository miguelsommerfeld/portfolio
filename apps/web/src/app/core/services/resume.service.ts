import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@config/api.config';
import { AuthService } from '@services/auth.service';
import { ErrorFeedbackService } from '@services/error-feedback.service';
import { type Observable, finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ResumeService
{
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly errorFeedback = inject(ErrorFeedbackService);

  private readonly _isCardOpen = signal(false);
  private readonly _isCheckingAccess = signal(false);

  public readonly isCardOpen = this._isCardOpen.asReadonly();
  public readonly isCheckingAccess = this._isCheckingAccess.asReadonly();

  public openCard(): void
  {
    this.errorFeedback.dismiss();
    this._isCardOpen.set(true);
  }

  public closeCard(): void
  {
    this._isCardOpen.set(false);
  }

  public requestResumeAccess(): void
  {
    if (this._isCheckingAccess()) {
      return;
    }

    this._isCheckingAccess.set(true);

    this.authService
      .verifySession()
      .pipe(finalize(() => this._isCheckingAccess.set(false)))
      .subscribe({
        next: () => this.openCard(),
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.authService.handleUnauthorized(true);
            return;
          }

          this.errorFeedback.showGenericError();
        },
      });
  }

  public fetchResumePdf(accessCode?: string): Observable<Blob>
  {
    const trimmedCode = accessCode?.trim();
    const headers = trimmedCode ? new HttpHeaders({ 'x-resume-code': trimmedCode }) : undefined;

    return this.http.get(`${API_BASE_URL}/resume`, {
      withCredentials: true,
      headers,
      responseType: 'blob',
    });
  }

  public openPdf(pdfBlob: Blob): void
  {
    const win = this.document.defaultView;
    if (!win || typeof URL.createObjectURL !== 'function') {
      return;
    }

    const objectUrl = URL.createObjectURL(pdfBlob);
    const openedWindow = win.open(objectUrl, '_blank', 'noopener,noreferrer');

    if (!openedWindow) {
      const link = this.document.createElement('a');
      link.href = objectUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      this.document.body.appendChild(link);
      link.click();
      link.remove();
    }

    win.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}
