import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    const win = doc.defaultView!;
    originalMatchMedia = win.matchMedia;
    originalScrollTo = win.scrollTo;
    Object.defineProperty(win, 'scrollTo', { value: vi.fn(), configurable: true, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    const win = doc.defaultView;
    if (win) {
      Object.defineProperty(win, 'matchMedia', { value: originalMatchMedia, configurable: true, writable: true });
      Object.defineProperty(win, 'scrollTo', { value: originalScrollTo, configurable: true, writable: true });
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

  it('should render the Resume component with the final CTA link pointing to /curriculo', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const resume = compiled.querySelector('app-resume');
    const ctaLink = compiled.querySelector<HTMLAnchorElement>('a[href="/curriculo"]');

    expect(resume).toBeTruthy();
    expect(ctaLink).toBeTruthy();
    expect(ctaLink?.textContent?.trim()).toBe('Acessar currículo');
    expect(ctaLink?.className).toContain('rounded-full');
  });
});
