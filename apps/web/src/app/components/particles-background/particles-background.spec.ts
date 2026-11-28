import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NgParticlesService } from '@tsparticles/angular';
import { type Container, type Particle, rgbToHsl, tsParticles } from '@tsparticles/engine';
import { ParticlesBackground, extractAccentRgb } from './particles-background';

function createMatchMediaMock(reducedMotion: boolean): typeof window.matchMedia {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion: reduce') ? reducedMotion : !reducedMotion,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function createFakeParticle(): Particle {
  return {
    fillColor: {
      h: { enable: false, value: 0, min: 0, max: 360 },
      s: { enable: false, value: 0, min: 0, max: 100 },
      l: { enable: false, value: 90, min: 0, max: 100 },
    },
  } as unknown as Particle;
}

describe('ParticlesBackground', () => {
  let doc: Document;
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let originalOffscreenCanvas: typeof window.OffscreenCanvas | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticlesBackground],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    originalMatchMedia = doc.defaultView?.matchMedia;
    originalOffscreenCanvas = doc.defaultView?.OffscreenCanvas;
  });

  afterEach(() => {
    const win = doc.defaultView;
    if (win) {
      Object.defineProperty(win, 'matchMedia', { value: originalMatchMedia, configurable: true, writable: true });
      Object.defineProperty(win, 'OffscreenCanvas', { value: originalOffscreenCanvas, configurable: true, writable: true });
    }
    vi.restoreAllMocks();
  });

  it('should extract RGB from accentGradient and fallback to neutral', () => {
    expect(extractAccentRgb('radial-gradient(circle at 22% 24%, rgba(56, 189, 248, 0.42), rgba(10, 10, 10, 0.96) 100%)')).toEqual({
      r: 56,
      g: 189,
      b: 248,
    });
    expect(extractAccentRgb(null)).toEqual({ r: 229, g: 229, b: 229 });
  });

  it('should render safely when OffscreenCanvas is unavailable and clean up on destroy', async () => {
    const initSpy = vi.spyOn(NgParticlesService.prototype, 'init').mockResolvedValue(undefined);

    const fixture = TestBed.createComponent(ParticlesBackground);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.className).toContain('pointer-events-none');
    expect(host.querySelector('ngx-particles')).toBeNull();
    expect(initSpy).not.toHaveBeenCalled();

    expect(() => fixture.destroy()).not.toThrow();
  });

  it('should initialize tsParticles and update particle colors on accentGradient change', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });
    Object.defineProperty(win, 'OffscreenCanvas', { value: class {}, configurable: true, writable: true });

    const drawSpy = vi.fn();
    const particles = [createFakeParticle(), createFakeParticle(), createFakeParticle()];
    const fakeContainer = {
      destroyed: false,
      destroy: vi.fn(),
      draw: drawSpy,
      particles: { count: particles.length, get: (index: number) => particles[index] },
    } as unknown as Container;

    const initSpy = vi.spyOn(NgParticlesService.prototype, 'init').mockResolvedValue(undefined);
    vi.spyOn(NgParticlesService.prototype, 'waitForInitialization').mockResolvedValue(undefined);
    vi.spyOn(NgParticlesService.prototype, 'assertInitialized').mockImplementation(() => {});
    vi.spyOn(tsParticles, 'load').mockResolvedValue(fakeContainer);

    const fixture = TestBed.createComponent(ParticlesBackground);
    await fixture.whenStable();

    const ngxParticles = (fixture.nativeElement as HTMLElement).querySelector('ngx-particles');
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(ngxParticles).toBeTruthy();
    expect(ngxParticles?.getAttribute('id')).toBeNull();
    expect(ngxParticles?.querySelector('div#tsparticles')).toBeTruthy();

    fixture.componentRef.setInput(
      'accentGradient',
      'radial-gradient(circle at 22% 24%, rgba(56, 189, 248, 0.42), rgba(10, 10, 10, 0.96) 100%)',
    );
    await fixture.whenStable();

    const expected = rgbToHsl({ r: 56, g: 189, b: 248 });
    expect(Math.round(particles[1].fillColor!.h.value)).toBe(Math.round(expected.h));
    expect(Math.round(particles[1].fillColor!.s.value)).toBe(Math.round(expected.s));
    expect(particles[0].fillColor!.l.value).toBeGreaterThan(particles[1].fillColor!.l.value);
    expect(drawSpy).toHaveBeenCalledWith(true);

    fixture.destroy();
  });
});
