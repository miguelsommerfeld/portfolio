import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@config/api.config';
import { type Observable, catchError, map, of } from 'rxjs';

export interface ApiHealthResponse {
  status: 'ok';
}

@Injectable({ providedIn: 'root' })
export class ApiHealthService
{
  private readonly http = inject(HttpClient);

  public check(): Observable<boolean>
  {
    return this.http.get<ApiHealthResponse>(`${API_BASE_URL}/health`).pipe(
      map((response) => response?.status === 'ok'),
      catchError(() => of(false)),
    );
  }
}
