import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { API_BASE_URL } from '@config/api.config';
import { ErrorFeedbackService } from '@services/error-feedback.service';
import { type Observable, finalize, tap } from 'rxjs';

export type AuthProvider = 'google' | 'github';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  provider: AuthProvider;
}

export interface AuthMeResponse {
  user: AuthUser;
  canAccessResumeCode?: boolean;
}

const POST_AUTH_ACTION_KEY = 'portfolio:post_auth_action';
const POST_AUTH_OPEN_RESUME = 'open_resume';

@Injectable({ providedIn: 'root' })
export class AuthService
{
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly errorFeedback = inject(ErrorFeedbackService);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _canAccessResumeCode = signal(false);
  private readonly _isLoggingOut = signal(false);
  private readonly _isAuthCardOpen = signal(false);
  private readonly _pendingResumeAccess = signal(false);

  public readonly user = this._user.asReadonly();
  public readonly isAuthenticated = computed(() => this._user() !== null);
  public readonly canAccessResumeCode = this._canAccessResumeCode.asReadonly();
  public readonly isLoggingOut = this._isLoggingOut.asReadonly();
  public readonly isAuthCardOpen = this._isAuthCardOpen.asReadonly();
  public readonly pendingResumeAccess = this._pendingResumeAccess.asReadonly();

  public checkSession(): void
  {
    this.verifySession().subscribe({
      next: () => {
        if (this.consumePostAuthOpenResume()) {
          this._pendingResumeAccess.set(true);
        }
      },
      error: () => {
        this._user.set(null);
        this._canAccessResumeCode.set(false);
        this.clearPostAuthAction();
      },
    });
  }

  public verifySession(): Observable<AuthMeResponse>
  {
    return this.http.get<AuthMeResponse>(`${API_BASE_URL}/auth/me`, { withCredentials: true }).pipe(
      tap((response) => {
        this._user.set(response.user);
        this._canAccessResumeCode.set(Boolean(response.canAccessResumeCode));
        this._isAuthCardOpen.set(false);
      }),
    );
  }

  public openAuthCard(): void
  {
    if (this.isAuthenticated()) {
      return;
    }

    this.errorFeedback.dismiss();
    this.clearPostAuthAction();
    this._isAuthCardOpen.set(true);
  }

  public handleUnauthorized(openResumeAfterAuth = false): void
  {
    this.errorFeedback.dismiss();
    this._user.set(null);
    this._canAccessResumeCode.set(false);

    if (openResumeAfterAuth) {
      this.savePostAuthOpenResume();
    } else {
      this.clearPostAuthAction();
    }

    this._isAuthCardOpen.set(true);
  }

  public revokeResumeCodeAccess(): void
  {
    this._canAccessResumeCode.set(false);
  }

  public closeAuthCard(): void
  {
    this.clearPostAuthAction();
    this._isAuthCardOpen.set(false);
  }

  public clearPendingResumeAccess(): void
  {
    this._pendingResumeAccess.set(false);
  }

  public getOAuthUrl(provider: AuthProvider): string
  {
    return `${API_BASE_URL}/auth/${provider}`;
  }

  public redirectToOAuth(provider: AuthProvider): void
  {
    this.document.defaultView?.location.assign(this.getOAuthUrl(provider));
  }

  public logout(): void
  {
    if (this._isLoggingOut()) {
      return;
    }

    this._isLoggingOut.set(true);

    this.http
      .post<void>(`${API_BASE_URL}/auth/logout`, null, { withCredentials: true })
      .pipe(finalize(() => this._isLoggingOut.set(false)))
      .subscribe({
        next: () => {
          this._user.set(null);
          this._canAccessResumeCode.set(false);
          this.clearPostAuthAction();
          this._pendingResumeAccess.set(false);
        },
        error: () => {
          this.errorFeedback.showGenericError();
        },
      });
  }

  private savePostAuthOpenResume(): void
  {
    try {
      this.document.defaultView?.sessionStorage.setItem(POST_AUTH_ACTION_KEY, POST_AUTH_OPEN_RESUME);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
  }

  private consumePostAuthOpenResume(): boolean
  {
    try {
      const storage = this.document.defaultView?.sessionStorage;
      const shouldOpen = storage?.getItem(POST_AUTH_ACTION_KEY) === POST_AUTH_OPEN_RESUME;
      storage?.removeItem(POST_AUTH_ACTION_KEY);
      return shouldOpen;
    } catch {
      return false;
    }
  }

  private clearPostAuthAction(): void
  {
    try {
      this.document.defaultView?.sessionStorage.removeItem(POST_AUTH_ACTION_KEY);
    } catch {
      // Ignore storage access errors in restricted environments.
    }
  }
}
