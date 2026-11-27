import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthCard } from '@components/auth-card/auth-card';
import { ErrorToast } from '@components/error-toast/error-toast';
import { Navbar } from '@components/navbar/navbar';
import { ResumeCard } from '@components/resume-card/resume-card';
import { ResumeCodeCard } from '@components/resume-code-card/resume-code-card';
import { SmoothScrollService } from '@services/smooth-scroll.service';

@Component({
  imports: [Navbar, RouterOutlet, AuthCard, ResumeCard, ResumeCodeCard, ErrorToast],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App
{
  private readonly smoothScroll = inject(SmoothScrollService);
  private readonly destroyRef = inject(DestroyRef);

  constructor()
  {
    afterNextRender(() => this.smoothScroll.init());
    this.destroyRef.onDestroy(() => this.smoothScroll.destroy());
  }
}
