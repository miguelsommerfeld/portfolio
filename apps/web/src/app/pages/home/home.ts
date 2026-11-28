import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { ParticlesBackground } from '@components/particles-background/particles-background';
import { ProjectShowcase } from '@components/project-showcase/project-showcase';
import { Resume } from '@components/resume/resume';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import gsap from 'gsap';
import { HOME_PROJECTS } from './home.projects';

const HERO_WELCOME_TEXT = 'Seja bem-vindo(a) ao meu portfolio!';
const TYPEWRITER_INTERVAL_MS = 55;

@Component({
  imports: [ParticlesBackground, ProjectShowcase, Resume],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home
{
  private readonly document = inject(DOCUMENT);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly smoothScroll = inject(SmoothScrollService);

  private typewriterTimer: ReturnType<typeof globalThis.setInterval> | null = null;
  private refreshFrameId: number | null = null;
  private gsapContext: gsap.Context | null = null;
  private sectionObserver: IntersectionObserver | null = null;

  protected readonly heroSectionRef = viewChild<ElementRef<HTMLElement>>('heroSectionRef');
  protected readonly heroContentRef = viewChild<ElementRef<HTMLElement>>('heroContentRef');

  protected readonly heroFullText = HERO_WELCOME_TEXT;
  protected readonly projects = HOME_PROJECTS;
  protected readonly displayedHeroText = signal('');
  protected readonly isTypingComplete = signal(false);
  protected readonly reducedMotion = signal(false);

  private readonly activeSectionId = signal('hero');
  private readonly projectAccents = signal<Record<string, string | undefined>>(
    Object.fromEntries(HOME_PROJECTS.map((project) => [project.id, project.slides[0]?.accentGradient])),
  );
  protected readonly activeAccentGradient = computed(() => this.projectAccents()[this.activeSectionId()] ?? null);

  constructor()
  {
    afterNextRender(() => {
      this.startTypewriter();
      this.setupScrollAnimations();
      this.setupSectionObserver();
      this.scheduleScrollTriggerRefresh();
    });

    this.destroyRef.onDestroy(() => {
      this.clearTypewriterTimer();
      this.cancelPendingRefresh();
      this.sectionObserver?.disconnect();
      this.sectionObserver = null;
      this.gsapContext?.revert();
      this.gsapContext = null;
    });
  }

  protected onProjectAccentChange(projectId: string, accentGradient: string | undefined): void
  {
    this.projectAccents.update((current) => (current[projectId] === accentGradient ? current : { ...current, [projectId]: accentGradient }));
  }

  private startTypewriter(): void
  {
    const win = this.document.defaultView;
    const prefersReducedMotion = Boolean(win && typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (prefersReducedMotion) {
      this.reducedMotion.set(true);
      this.displayedHeroText.set(this.heroFullText);
      this.isTypingComplete.set(true);
      return;
    }

    let currentLength = 0;

    this.typewriterTimer = globalThis.setInterval(() => {
      currentLength += 1;
      this.displayedHeroText.set(this.heroFullText.slice(0, currentLength));

      if (currentLength >= this.heroFullText.length) {
        this.clearTypewriterTimer();
        this.isTypingComplete.set(true);
      }
    }, TYPEWRITER_INTERVAL_MS);
  }

  private setupScrollAnimations(): void
  {
    const win = this.document.defaultView;
    const heroSection = this.heroSectionRef()?.nativeElement;
    const heroContent = this.heroContentRef()?.nativeElement;

    if (!win || typeof win.matchMedia !== 'function' || !this.smoothScroll.registerScrollTrigger()) {
      return;
    }

    this.gsapContext = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (heroSection && heroContent) {
          gsap.to(heroContent, {
            opacity: 0,
            y: -40,
            ease: 'none',
            scrollTrigger: { trigger: heroSection, start: 'top top', end: 'bottom top', scrub: true },
          });
        }
      });
    });
  }

  private setupSectionObserver(): void
  {
    const win = this.document.defaultView;
    if (!win || typeof win.IntersectionObserver !== 'function') {
      return;
    }

    this.sectionObserver = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.isIntersecting ? (entry.target as HTMLElement).dataset['particleSection'] : undefined;
          if (sectionId) {
            this.activeSectionId.set(sectionId);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    const targets = (this.hostRef.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-particle-section]');
    targets.forEach((target) => this.sectionObserver?.observe(target));
  }

  private scheduleScrollTriggerRefresh(): void
  {
    const win = this.document.defaultView;

    if (!win || typeof win.requestAnimationFrame !== 'function') {
      this.smoothScroll.refresh();
      return;
    }

    this.refreshFrameId = win.requestAnimationFrame(() => {
      this.refreshFrameId = null;
      this.smoothScroll.refresh();
    });
  }

  private clearTypewriterTimer(): void
  {
    if (this.typewriterTimer !== null) {
      globalThis.clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
  }

  private cancelPendingRefresh(): void
  {
    const win = this.document.defaultView;

    if (this.refreshFrameId !== null && win && typeof win.cancelAnimationFrame === 'function') {
      win.cancelAnimationFrame(this.refreshFrameId);
      this.refreshFrameId = null;
    }
  }
}
