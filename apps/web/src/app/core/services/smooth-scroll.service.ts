import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis, { type ScrollToOptions } from 'lenis';
import { Subscription, filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SmoothScrollService
{
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly _isActive = signal(false);

  private lenis: Lenis | null = null;
  private tickerCallback: ((time: number) => void) | null = null;
  private routerSubscription: Subscription | null = null;
  private scrollTriggerRegistered = false;

  public readonly isActive = this._isActive.asReadonly();

  public registerScrollTrigger(): boolean
  {
    const win = this.document.defaultView;

    if (!win || typeof win.matchMedia !== 'function') {
      return false;
    }

    if (!this.scrollTriggerRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      this.scrollTriggerRegistered = true;
    }

    return true;
  }

  public init(): void
  {
    const win = this.document.defaultView;

    if (this.lenis || !win || typeof win.matchMedia !== 'function' || win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.registerScrollTrigger();

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);

    const update = (time: number): void => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    this.lenis = lenis;
    this.tickerCallback = update;
    this._isActive.set(true);

    this.routerSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      lenis.scrollTo(0, { immediate: true });
      ScrollTrigger.refresh();
    });
  }

  public scrollTo(target: number | string | HTMLElement, options?: ScrollToOptions): void
  {
    if (this.lenis) {
      this.lenis.scrollTo(target, options);
      return;
    }

    const win = this.document.defaultView;
    if (!win) {
      return;
    }

    if (typeof target === 'number') {
      win.scrollTo({ top: target, behavior: options?.immediate ? 'instant' : 'smooth' });
      return;
    }

    const element = typeof target === 'string' ? this.document.querySelector(target) : target;
    element?.scrollIntoView({ behavior: options?.immediate ? 'instant' : 'smooth' });
  }

  public refresh(): void
  {
    const win = this.document.defaultView;

    if (this.scrollTriggerRegistered && win && typeof win.matchMedia === 'function') {
      ScrollTrigger.refresh();
    }
  }

  public destroy(): void
  {
    this.routerSubscription?.unsubscribe();
    this.routerSubscription = null;

    if (this.tickerCallback) {
      gsap.ticker.remove(this.tickerCallback);
      this.tickerCallback = null;
    }

    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }

    this._isActive.set(false);
  }
}
