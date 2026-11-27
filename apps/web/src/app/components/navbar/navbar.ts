import { Component, inject } from '@angular/core';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
})
export class Navbar
{
  private readonly authService = inject(AuthService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isLoggingOut = this.authService.isLoggingOut;
  protected readonly linkedinProfileUrl = 'https://www.linkedin.com/in/miguelsommerfeld/';
  protected readonly githubProfileUrl = 'https://github.com/miguelsommerfeld';

  protected onOpenAuth(): void
  {
    this.authService.openAuthCard();
  }

  protected onLogout(): void
  {
    this.authService.logout();
  }
}
