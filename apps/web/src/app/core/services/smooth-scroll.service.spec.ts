import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SmoothScrollService } from './smooth-scroll.service';

function createMatchMediaMock(matches: boolean): typeof window.matchMedia {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('SmoothScrollService', () => {
  let service: SmoothScrollService;
  let doc: Document;
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let originalResizeObserver: typeof ResizeObserver | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    service = TestBed.inject(SmoothScrollService);
    doc = TestBed.inject(DOCUMENT);

    const win = doc.defaultView!;
    originalMatchMedia = win.matchMedia;
    originalResizeObserver = globalThis.ResizeObserver;

    globalThis.ResizeObserver = class {
      public observe(): void {}
      public unobserve(): void {}
      public disconnect(): void {}
    };
  });

  afterEach(() => {
    service.destroy();
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: originalMatchMedia, configurable: true, writable: true });
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    vi.restoreAllMocks();
  });

  it('should initialize and destroy Lenis smoothly', () => {
    const win = doc.defaultView!;
    Object.defineProperty(win, 'matchMedia', { value: createMatchMediaMock(false), configurable: true, writable: true });

    expect(service.isActive()).toBe(false);

    service.init();
    expect(service.isActive()).toBe(true);

    // Calling init twice should be idempotent.
    service.init();
    expect(service.isActive()).toBe(true);

    service.destroy();
    expect(service.isActive()).toBe(false);
  });

  it('should skip initialization when prefers-reduced-motion is enabled', () => {
    const win = doc.defaultView!;
    const matchMediaMock = createMatchMediaMock(true);
    Object.defineProperty(win, 'matchMedia', { value: matchMediaMock, configurable: true, writable: true });

    service.init();

    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(service.isActive()).toBe(false);
  });
});
