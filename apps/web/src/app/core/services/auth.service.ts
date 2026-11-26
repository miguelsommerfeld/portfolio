import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { API_BASE_URL } from '@config/api.config';

export type AuthProvider = 'google' | 'github';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  provider: AuthProvider;
}

interface AuthMeResponse {
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService
{
  private readonly http = inject(HttpClient);
  private readonly _user = signal<AuthUser | null>(null);
  private readonly _isLoggingOut = signal(false);

  public readonly user = this._user.asReadonly();
  public readonly isAuthenticated = computed(() => this._user() !== null);
  public readonly isLoggingOut = this._isLoggingOut.asReadonly();

  public checkSession(): void
  {
    this.http.get<AuthMeResponse>(`${API_BASE_URL}/auth/me`, { withCredentials: true }).subscribe({
      next: (response) => this._user.set(response.user),
      error: () => this._user.set(null),
    });
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
        next: () => this._user.set(null),
        error: () => {
          // Keep current state when logout request fails.
        },
      });
  }
}
