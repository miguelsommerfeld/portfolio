import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { ErrorFeedbackService } from '@services/error-feedback.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    redirectTo: (redirectData) => {
      if (redirectData.queryParamMap.has('error')) {
        inject(AuthService).closeAuthCard();
        inject(ErrorFeedbackService).showGenericError();
      }

      return inject(Router).createUrlTree(['/']);
    },
  },
];
