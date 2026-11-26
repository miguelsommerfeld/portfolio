import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Resume } from './resume';

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

describe('Resume', () => {
  let doc: Document;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resume],
      providers: [provideRouter([])],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
    originalMatchMedia = doc.defaultView?.matchMedia;
  });

  afterEach(() => {
    const win = doc.defaultView;
    if (win) {
      Object.defineProperty(win, 'matchMedia', { value: originalMatchMedia, configurable: true, writable: true });
    }
    vi.restoreAllMocks();
  });

  it('should render the resume sheet with crisp name, decorative blurred body, question mark and dark glossy CTA', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(false), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Resume);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector<HTMLElement>('section[aria-label="Acesso ao currículo"]');
    const heading = compiled.querySelector('h2');
    const blurredBody = compiled.querySelector<HTMLElement>('[data-testid="resume-blurred-body"]');
    const questionMark = compiled.querySelector<HTMLElement>('[data-testid="resume-question-mark"]');
    const ctaLink = compiled.querySelector<HTMLAnchorElement>('a[href="/curriculo"]');

    expect(section).toBeTruthy();
    expect(section?.className).toContain('min-h-[155vh]');
    expect(heading?.textContent?.trim()).toBe('Miguel L. Sommerfeld');
    expect(blurredBody?.getAttribute('aria-hidden')).toBe('true');
    expect(questionMark?.getAttribute('aria-hidden')).toBe('true');

    expect(ctaLink).toBeTruthy();
    expect(ctaLink?.textContent?.trim()).toBe('Acessar currículo');
    expect(ctaLink?.className).toContain('rounded-full');
    expect(ctaLink?.className).toContain('bg-neutral-950/90');
    expect(ctaLink?.className).not.toContain('backdrop-blur-xl');
  });

  it('should disable the extra scroll track when prefers-reduced-motion is enabled', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(true), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Resume);
    await fixture.whenStable();

    const section = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('section[aria-label="Acesso ao currículo"]');
    expect(section?.className).toContain('min-h-screen');
    expect(section?.className).not.toContain('min-h-[155vh]');
  });

  it('should safely handle jsdom without window.matchMedia and clean up on destroy', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: undefined, configurable: true, writable: true });

    const fixture = TestBed.createComponent(Resume);
    await fixture.whenStable();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
