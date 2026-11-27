import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { ResumeService } from '@services/resume.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import gsap from 'gsap';

interface ResumePreviewSection {
  heading: string;
  entries: { title: string; subtitle: string; summary: string }[];
}

const PREVIEW_SECTIONS: readonly ResumePreviewSection[] = [
  {
    heading: 'RESUMO',
    entries: [
      {
        title: 'Engenharia de Software Fullstack',
        subtitle: 'Arquitetura Web · APIs Stateless · Interfaces Reativas',
        summary: 'Desenvolvimento de sistemas web escaláveis com foco em performance, tipagem estrita e experiência de usuário refinada.',
      },
    ],
  },
  {
    heading: 'EXPERIÊNCIA',
    entries: [
      {
        title: 'Desenvolvedor Fullstack',
        subtitle: '2025 — Atual · Arquitetura Monorepo & Cloud',
        summary: 'Criação de aplicações modernas em Angular e Node.js com autenticação OAuth2, pipelines automatizados e design systems.',
      },
      {
        title: 'Desenvolvedor de Software',
        subtitle: '2023 — 2025 · Sistemas Web & Integrações',
        summary: 'Evolução de APIs REST de baixa latência, modelagem de contratos e otimização de fluxos críticos em produção.',
      },
    ],
  },
  {
    heading: 'FORMAÇÃO',
    entries: [
      {
        title: 'Análise e Desenvolvimento de Sistemas',
        subtitle: 'Sistemas Distribuídos · Estruturas de Dados · Segurança',
        summary: 'Base sólida em arquitetura de software, redes, boas práticas de engenharia e testes automatizados.',
      },
    ],
  },
  {
    heading: 'STACK TÉCNICA',
    entries: [
      {
        title: 'TypeScript · Angular · Node.js · Fastify · Tailwind CSS',
        subtitle: 'Docker · Git · Vitest · GSAP · Arquitetura Stateless',
        summary: 'Ecossistema moderno ponta a ponta com validação de contratos, observabilidade e entrega contínua.',
      },
    ],
  },
];

@Component({
  host: { class: 'block' },
  selector: 'app-resume',
  templateUrl: './resume.html',
})
export class Resume
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly resumeService = inject(ResumeService);
  private readonly smoothScroll = inject(SmoothScrollService);

  private gsapContext: gsap.Context | null = null;

  protected readonly sectionRef = viewChild<ElementRef<HTMLElement>>('sectionRef');
  protected readonly glowRef = viewChild<ElementRef<HTMLElement>>('glowRef');
  protected readonly sheetRef = viewChild<ElementRef<HTMLElement>>('sheetRef');
  protected readonly questionMarkRef = viewChild<ElementRef<HTMLElement>>('questionMarkRef');
  protected readonly ctaWrapRef = viewChild<ElementRef<HTMLElement>>('ctaWrapRef');

  protected readonly previewSections = PREVIEW_SECTIONS;
  protected readonly isCheckingAccess = this.resumeService.isCheckingAccess;
  protected readonly reducedMotion = signal(false);

  constructor()
  {
    afterNextRender(() => this.setupScrollAnimation());

    this.destroyRef.onDestroy(() => {
      this.gsapContext?.revert();
      this.gsapContext = null;
    });
  }

  protected onAccessResume(): void
  {
    this.resumeService.requestResumeAccess();
  }

  protected onCtaFocus(event: FocusEvent): void
  {
    const target = event.target;
    const win = this.document.defaultView;
    const section = this.sectionRef()?.nativeElement;

    if (!win || !section || this.reducedMotion() || !(target instanceof HTMLElement)) {
      return;
    }

    try {
      if (!target.matches(':focus-visible')) {
        return;
      }
    } catch {
      return;
    }

    const rect = section.getBoundingClientRect();
    if (rect.bottom > win.innerHeight + 4) {
      const targetY = Math.max(0, win.scrollY + rect.bottom - win.innerHeight);
      this.smoothScroll.scrollTo(targetY);
    }
  }

  private setupScrollAnimation(): void
  {
    const win = this.document.defaultView;
    const section = this.sectionRef()?.nativeElement;
    const sheet = this.sheetRef()?.nativeElement;

    if (!win || typeof win.matchMedia !== 'function') {
      return;
    }

    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.reducedMotion.set(true);
      return;
    }

    if (!section || !sheet || !this.smoothScroll.registerScrollTrigger()) {
      return;
    }

    const glow = this.glowRef()?.nativeElement;
    const questionMark = this.questionMarkRef()?.nativeElement;
    const ctaWrap = this.ctaWrapRef()?.nativeElement;

    this.gsapContext = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
        this.createRevealTimeline(section, sheet, glow, questionMark, ctaWrap, 48, 26);
      });

      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
        this.createRevealTimeline(section, sheet, glow, questionMark, ctaWrap, 34, 20);
      });
    }, section);
  }

  private createRevealTimeline(
    section: HTMLElement,
    sheet: HTMLElement,
    glow: HTMLElement | undefined,
    questionMark: HTMLElement | undefined,
    ctaWrap: HTMLElement | undefined,
    startYPercent: number,
    startRotateX: number,
  ): void
  {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    timeline.fromTo(
      sheet,
      { yPercent: startYPercent, rotateX: startRotateX, scale: 0.84, opacity: 0.35, transformOrigin: '50% 100%' },
      { yPercent: 0, rotateX: 0, scale: 1, opacity: 1, ease: 'power2.out', duration: 0.72 },
      0,
    );

    if (glow) {
      timeline.fromTo(glow, { opacity: 0.35, scale: 0.85 }, { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.72 }, 0);
    }

    if (questionMark) {
      timeline.fromTo(questionMark, { y: 20, scale: 0.9, opacity: 0.4 }, { y: 0, scale: 1, opacity: 1, ease: 'power2.out', duration: 0.6 }, 0.15);
    }

    if (ctaWrap) {
      timeline.fromTo(ctaWrap, { opacity: 0, y: 16, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.3 }, 0.62);
    }

    timeline.to({}, { duration: 0.08 }, 0.92);
  }
}
