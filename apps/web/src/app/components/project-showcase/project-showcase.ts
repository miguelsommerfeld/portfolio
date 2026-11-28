import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { type ProjectShowcaseItem, type ProjectSlide } from './project-showcase.models';

const DEFAULT_ACCENT_GRADIENT = 'radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.14), rgba(23, 23, 23, 0.92) 72%)';

@Component({
  host: { class: 'block' },
  selector: 'app-project-showcase',
  templateUrl: './project-showcase.html',
})
export class ProjectShowcase
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly smoothScroll = inject(SmoothScrollService);

  private gsapContext: gsap.Context | null = null;
  private pinTrigger: ScrollTrigger | null = null;

  public readonly project = input.required<ProjectShowcaseItem>();
  public readonly projectIndex = input<number>(0);
  public readonly activeAccentChange = output<string | undefined>();

  protected readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  protected readonly contentRef = viewChild<ElementRef<HTMLElement>>('contentRef');
  protected readonly activeSlideIndex = signal(0);
  protected readonly failedImages = signal<ReadonlySet<string>>(new Set());

  protected readonly formattedProjectNumber = computed(() => this.formatIndex(this.projectIndex() + 1));
  protected readonly activeSlide = computed(() => this.project().slides[this.activeSlideIndex()] ?? null);
  protected readonly formattedSlideCounter = computed(() => {
    const total = this.project().slides.length;
    const current = total > 0 ? this.activeSlideIndex() + 1 : 0;
    return `${this.formatIndex(current)} / ${this.formatIndex(total)}`;
  });

  constructor()
  {
    afterNextRender(() => this.setupScrollAnimation());

    effect(() => {
      this.activeAccentChange.emit(this.activeSlide()?.accentGradient);
    });

    this.destroyRef.onDestroy(() => {
      this.pinTrigger = null;
      this.gsapContext?.revert();
      this.gsapContext = null;
    });
  }

  protected formatIndex(value: number): string
  {
    return String(value).padStart(2, '0');
  }

  protected hasValidImage(slide: ProjectSlide): boolean
  {
    return Boolean(slide.imageUrl && !this.failedImages().has(slide.id));
  }

  protected onImageError(slideId: string): void
  {
    this.failedImages.update((current) => {
      const next = new Set(current);
      next.add(slideId);
      return next;
    });
  }

  protected slideFallbackBackground(slide: ProjectSlide): string
  {
    return slide.accentGradient ?? DEFAULT_ACCENT_GRADIENT;
  }

  protected selectSlide(index: number): void
  {
    const slides = this.project().slides;
    if (index < 0 || index >= slides.length) {
      return;
    }

    if (this.pinTrigger && slides.length > 1) {
      const progress = (index + 0.5) / slides.length;
      const targetY = this.pinTrigger.start + (this.pinTrigger.end - this.pinTrigger.start) * progress;
      this.smoothScroll.scrollTo(targetY);
      return;
    }

    this.activeSlideIndex.set(index);
  }

  private setupScrollAnimation(): void
  {
    const win = this.document.defaultView;
    const section = this.sectionRef()?.nativeElement;
    const content = this.contentRef()?.nativeElement;

    if (!win || typeof win.matchMedia !== 'function' || !section || !content || !this.smoothScroll.registerScrollTrigger()) {
      return;
    }

    this.gsapContext = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
        const slides = this.project().slides;

        if (slides.length <= 1) {
          gsap.from(content, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 80%', once: true },
          });
          return;
        }

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.max(1, this.project().slides.length - 1) * 90}%`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const total = this.project().slides.length;
            if (total <= 0) {
              return;
            }
            const nextIndex = Math.min(total - 1, Math.floor(self.progress * total));
            if (nextIndex !== this.activeSlideIndex()) {
              this.activeSlideIndex.set(nextIndex);
            }
          },
        });

        this.pinTrigger = trigger;

        return () => {
          this.pinTrigger = null;
        };
      });

      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
        this.pinTrigger = null;
        gsap.from(content, {
          opacity: 0,
          y: 20,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 85%', once: true },
        });
      });
    }, section);
  }
}
