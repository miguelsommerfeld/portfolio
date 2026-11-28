import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, afterNextRender, effect, inject, input, signal } from '@angular/core';
import { type IParticlesProps, NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import { type Container, type Engine, type IRgb, colorMix, rgbToHsl } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import gsap from 'gsap';

const DEFAULT_RGB: IRgb = { r: 229, g: 229, b: 229 };
const WHITE_RGB: IRgb = { r: 255, g: 255, b: 255 };
const RGB_REGEX = /rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/;

const initParticlesEngine = async (engine: Engine): Promise<void> => {
  await loadSlim(engine);
};

export function extractAccentRgb(gradient?: string | null): IRgb {
  const match = gradient ? RGB_REGEX.exec(gradient) : null;
  return match ? { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) } : { ...DEFAULT_RGB };
}

function buildParticlesOptions(reducedMotion: boolean): IParticlesProps {
  return {
    autoPlay: true,
    background: { color: { value: 'transparent' } },
    detectRetina: true,
    fpsLimit: 60,
    fullScreen: { enable: false },
    interactivity: {
      detectsOn: 'window',
      events: { onHover: { enable: !reducedMotion, mode: 'repulse' } },
      modes: { repulse: { distance: 110, duration: 0.6, easing: 'ease-out-quad', factor: 25, maxSpeed: 3, speed: 0.35 } },
    },
    pauseOnBlur: true,
    particles: {
      number: { value: 72, density: { enable: true, width: 1920, height: 1080 } },
      paint: { fill: { enable: true, color: { value: '#e5e5e5' } } },
      shape: { type: 'circle' },
      size: { value: { min: 0.9, max: 2.2 } },
      opacity: { value: { min: 0.14, max: 0.58 }, animation: { enable: !reducedMotion, speed: 0.45, sync: false } },
      move: { enable: !reducedMotion, speed: { min: 0.12, max: 0.42 }, direction: 'none', random: true, straight: false, outModes: { default: 'out' } },
    },
  };
}

@Component({
  host: { class: 'pointer-events-none fixed inset-0 z-0 block select-none overflow-hidden', 'aria-hidden': 'true' },
  imports: [NgxParticlesModule],
  selector: 'app-particles-background',
  templateUrl: './particles-background.html',
})
export class ParticlesBackground
{
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly particlesService = inject(NgParticlesService);

  private container: Container | null = null;
  private colorTween: gsap.core.Tween | null = null;
  private currentRgb: IRgb = { ...DEFAULT_RGB };
  private destroyed = false;

  public readonly accentGradient = input<string | null | undefined>(null);

  protected readonly isReady = signal(false);
  protected readonly reducedMotion = signal(false);
  protected readonly options = signal<IParticlesProps>(buildParticlesOptions(false));

  constructor()
  {
    afterNextRender(() => {
      void this.initParticles();
    });

    effect(() => {
      this.transitionColor(extractAccentRgb(this.accentGradient()));
    });

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.colorTween?.kill();
      this.colorTween = null;
      this.container = null;
    });
  }

  protected onParticlesLoaded(container: Container | undefined): void
  {
    this.container = container ?? null;
    this.currentRgb = extractAccentRgb(this.accentGradient());
    this.applyColors();
  }

  private async initParticles(): Promise<void>
  {
    const win = this.document.defaultView;
    const reduced = Boolean(win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    this.reducedMotion.set(reduced);
    this.options.set(buildParticlesOptions(reduced));

    if (typeof win?.OffscreenCanvas !== 'function') {
      return;
    }

    try {
      await this.particlesService.init(initParticlesEngine);
      if (!this.destroyed) {
        this.isReady.set(true);
      }
    } catch {
      return;
    }
  }

  private transitionColor(target: IRgb): void
  {
    this.colorTween?.kill();
    this.colorTween = null;

    if (!this.container || this.reducedMotion()) {
      this.currentRgb = { ...target };
      this.applyColors();
      return;
    }

    this.colorTween = gsap.to(this.currentRgb, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.75,
      ease: 'power2.out',
      onUpdate: () => this.applyColors(),
    });
  }

  private applyColors(): void
  {
    const container = this.container;
    if (!container || container.destroyed) {
      return;
    }

    const primary = rgbToHsl(this.currentRgb);
    const highlight = rgbToHsl(colorMix(this.currentRgb, WHITE_RGB, 1, 1.2));

    for (let i = 0; i < container.particles.count; i++) {
      const fill = container.particles.get(i)?.fillColor;
      if (!fill) {
        continue;
      }
      const target = i % 3 === 0 ? highlight : primary;
      fill.h.value = target.h;
      fill.s.value = target.s;
      fill.l.value = target.l;
    }

    if (this.reducedMotion()) {
      container.draw(true);
    }
  }
}
