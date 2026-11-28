import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ParticlesBackground } from '@components/particles-background/particles-background';
import { ResumeService } from '@services/resume.service';
import { Home } from './home';
import { HOME_PROJECTS } from './home.projects';

function createMatchMediaMock(reducedMotion: boolean): typeof window.matchMedia {
  return vi.fn().mockImplementation((query: string) => {
    let matches = false;

    if (query.includes('prefers-reduced-motion: reduce')) {
      matches = reducedMotion;
    } else if (query.includes('prefers-reduced-motion: no-preference')) {
      matches = !reducedMotion;
    }

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
}

describe('Home', () => {
  let doc: Document;
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let originalScrollTo: typeof window.scrollTo | undefined;
  let originalIntersectionObserver: typeof window.IntersectionObserver | undefined;
  let requestResumeAccessSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    requestResumeAccessSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: ResumeService,
          useValue: {
            isCheckingAccess: signal(false).asReadonly(),
            requestResumeAccess: requestResumeAccessSpy,
          },
        },
      ],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    const win = doc.defaultView!;
    originalMatchMedia = win.matchMedia;
    originalScrollTo = win.scrollTo;
    originalIntersectionObserver = win.IntersectionObserver;
    Object.defineProperty(win, 'scrollTo', { value: vi.fn(), configurable: true, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    const win = doc.defaultView;
    if (win) {
      Object.defineProperty(win, 'matchMedia', { value: originalMatchMedia, configurable: true, writable: true });
      Object.defineProperty(win, 'scrollTo', { value: originalScrollTo, configurable: true, writable: true });
      Object.defineProperty(win, 'IntersectionObserver', { value: originalIntersectionObserver, configurable: true, writable: true });
    }
    vi.restoreAllMocks();
  });

  it('should progressively type the welcome message in h1 using the Typewriter Effect', () => {
    vi.useFakeTimers();
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(false), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('');

    vi.advanceTimersByTime(55 * 4);
    fixture.detectChanges();
    expect(h1?.textContent?.trim()).toBe('Seja');

    vi.advanceTimersByTime(55 * 40);
    fixture.detectChanges();
    expect(h1?.textContent?.trim()).toBe('Seja bem-vindo(a) ao meu portfolio!');

    fixture.destroy();
  });

  it('should display the full welcome message immediately when prefers-reduced-motion is enabled', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const h1 = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Seja bem-vindo(a) ao meu portfolio!');
  });

  it('should render one ProjectShowcase component per project in HOME_PROJECTS', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const showcases = (fixture.nativeElement as HTMLElement).querySelectorAll('app-project-showcase');
    expect(showcases.length).toBe(HOME_PROJECTS.length);
    expect(showcases.length).toBe(3);
  });

  it('should sync ParticlesBackground accentGradient with the active project section and slide', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });

    const observerState: { callback: IntersectionObserverCallback | null } = { callback: null };
    const disconnectSpy = vi.fn();

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback)
      {
        observerState.callback = callback;
      }

      public observe(): void {}
      public disconnect(): void { disconnectSpy(); }
    }

    Object.defineProperty(win, 'IntersectionObserver', { value: MockIntersectionObserver, configurable: true, writable: true });

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const particlesComponent = fixture.debugElement.query(By.directive(ParticlesBackground)).componentInstance as ParticlesBackground;
    expect(particlesComponent.accentGradient()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstShowcase = compiled.querySelector<HTMLElement>(`app-project-showcase[data-particle-section="${HOME_PROJECTS[0].id}"]`)!;
    const resumeEl = compiled.querySelector<HTMLElement>('app-resume[data-particle-section="resume"]')!;

    observerState.callback?.([{ isIntersecting: true, target: firstShowcase } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    await fixture.whenStable();
    expect(particlesComponent.accentGradient()).toBe(HOME_PROJECTS[0].slides[0].accentGradient);

    const slideButtons = firstShowcase.querySelectorAll<HTMLButtonElement>('ol li button');
    slideButtons[1].click();
    await fixture.whenStable();
    expect(particlesComponent.accentGradient()).toBe(HOME_PROJECTS[0].slides[1].accentGradient);

    observerState.callback?.([{ isIntersecting: true, target: resumeEl } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    await fixture.whenStable();
    expect(particlesComponent.accentGradient()).toBeNull();

    fixture.destroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('should render the Resume component and request resume access on CTA click', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const resume = compiled.querySelector('app-resume');
    const ctaButton = resume?.querySelector<HTMLButtonElement>('button');

    expect(resume).toBeTruthy();
    expect(ctaButton?.textContent?.trim()).toBe('Acessar currículo');
    expect(ctaButton?.className).toContain('rounded-full');

    ctaButton?.click();
    expect(requestResumeAccessSpy).toHaveBeenCalledTimes(1);
  });
});
