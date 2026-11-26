import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { Navbar } from './components/navbar/navbar';

@Component({
  imports: [Navbar, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
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
