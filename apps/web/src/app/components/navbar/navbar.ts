import { Component, inject } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { ResumeService } from '@services/resume.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
})
export class Navbar
{
  private readonly authService = inject(AuthService);
  private readonly resumeService = inject(ResumeService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly canAccessResumeCode = this.authService.canAccessResumeCode;
  protected readonly isLoggingOut = this.authService.isLoggingOut;
  protected readonly linkedinProfileUrl = 'https://www.linkedin.com/in/miguelsommerfeld/';
  protected readonly githubProfileUrl = 'https://github.com/miguelsommerfeld';

  protected onOpenAuth(): void
  {
    this.authService.openAuthCard();
  }

  protected onOpenCode(): void
  {
    this.resumeService.openCodeCard();
  }

  protected onLogout(): void
  {
    this.authService.logout();
  }
}
