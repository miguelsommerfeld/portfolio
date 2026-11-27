import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResumeService } from '@services/resume.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
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
  let isCheckingAccessSignal: ReturnType<typeof signal<boolean>>;
  let requestResumeAccessSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    isCheckingAccessSignal = signal(false);
    requestResumeAccessSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Resume],
      providers: [
        provideRouter([]),
        {
          provide: ResumeService,
          useValue: {
            isCheckingAccess: isCheckingAccessSignal.asReadonly(),
            requestResumeAccess: requestResumeAccessSpy,
          },
        },
      ],
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

  it('should render the resume sheet and delegate CTA click to ResumeService.requestResumeAccess', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(false), configurable: true, writable: true });

    const fixture = TestBed.createComponent(Resume);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector<HTMLElement>('section[aria-label="Acesso ao currículo"]');
    const heading = compiled.querySelector('h2');
    const blurredBody = compiled.querySelector<HTMLElement>('[data-testid="resume-blurred-body"]');
    const questionMark = compiled.querySelector<HTMLElement>('[data-testid="resume-question-mark"]');
    const ctaButton = compiled.querySelector<HTMLButtonElement>('button');

    expect(section).toBeTruthy();
    expect(section?.className).toContain('min-h-[155vh]');
    expect(heading?.textContent?.trim()).toBe('Miguel L. Sommerfeld');
    expect(blurredBody?.getAttribute('aria-hidden')).toBe('true');
    expect(questionMark?.getAttribute('aria-hidden')).toBe('true');

    expect(ctaButton).toBeTruthy();
    expect(ctaButton?.textContent?.trim()).toBe('Acessar currículo');
    expect(ctaButton?.className).toContain('rounded-full');
    expect(ctaButton?.className).toContain('bg-neutral-950/90');
    expect(ctaButton?.className).not.toContain('backdrop-blur-xl');

    ctaButton?.click();
    expect(requestResumeAccessSpy).toHaveBeenCalledTimes(1);

    isCheckingAccessSignal.set(true);
    await fixture.whenStable();
    expect(ctaButton?.disabled).toBe(true);
  });

  it('should not scroll when CTA receives non-keyboard focus', async () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(false), configurable: true, writable: true });
    const smoothScroll = TestBed.inject(SmoothScrollService);
    const scrollToSpy = vi.spyOn(smoothScroll, 'scrollTo');

    const fixture = TestBed.createComponent(Resume);
    await fixture.whenStable();

    const ctaButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!;
    vi.spyOn(ctaButton, 'matches').mockReturnValue(false);

    ctaButton.dispatchEvent(new FocusEvent('focus'));
    expect(scrollToSpy).not.toHaveBeenCalled();
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
