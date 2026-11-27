import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@config/api.config';
import { AuthService, type AuthProvider } from '@services/auth.service';
import { SmoothScrollService } from '@services/smooth-scroll.service';
import { AuthCard } from './auth-card';

describe('AuthCard', () => {
  let isAuthCardOpenSignal: ReturnType<typeof signal<boolean>>;
  let closeAuthCardSpy: ReturnType<typeof vi.fn>;
  let cancelMomentumSpy: ReturnType<typeof vi.fn>;
  let doc: Document;

  beforeEach(async () => {
    isAuthCardOpenSignal = signal(false);
    closeAuthCardSpy = vi.fn(() => isAuthCardOpenSignal.set(false));
    cancelMomentumSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AuthCard],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthCardOpen: isAuthCardOpenSignal.asReadonly(),
            closeAuthCard: closeAuthCardSpy,
            getOAuthUrl: (provider: AuthProvider) => `${API_BASE_URL}/auth/${provider}`,
          },
        },
        {
          provide: SmoothScrollService,
          useValue: {
            cancelMomentum: cancelMomentumSpy,
          },
        },
      ],
    }).compileComponents();

    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render the dialog when closed', async () => {
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
    expect(cancelMomentumSpy).not.toHaveBeenCalled();
  });

  it('should render the centered liquid glass dialog with Google and GitHub OAuth links without mutating body overflow', async () => {
    isAuthCardOpenSignal.set(true);
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const dialog = compiled.querySelector<HTMLElement>('[role="dialog"]');
    const links = Array.from(compiled.querySelectorAll<HTMLAnchorElement>('a'));
    const googleLink = links.find((link) => link.getAttribute('href') === `${API_BASE_URL}/auth/google`);
    const githubLink = links.find((link) => link.getAttribute('href') === `${API_BASE_URL}/auth/github`);
    const googleIcon = googleLink?.querySelector<HTMLImageElement>('img');
    const githubIcon = githubLink?.querySelector<HTMLImageElement>('img');

    expect(dialog).toBeTruthy();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('auth-card-title');
    expect(dialog?.className).toContain('rounded-3xl');
    expect(dialog?.className).toContain('backdrop-blur-2xl');

    expect(links.length).toBe(2);
    expect(googleLink?.textContent).toContain('Continuar com Google');
    expect(googleIcon?.getAttribute('src')).toBe('/icons/google.png');
    expect(googleIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(googleIcon?.className).not.toContain('invert');

    expect(githubLink?.textContent).toContain('Continuar com GitHub');
    expect(githubIcon?.getAttribute('src')).toBe('/icons/github.png');
    expect(githubIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(githubIcon?.className).toContain('invert');

    expect(cancelMomentumSpy).toHaveBeenCalledTimes(1);
    expect(doc.body.style.overflow).toBe('');
  });

  it('should close when clicking the close button', async () => {
    isAuthCardOpenSignal.set(true);
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();

    const closeButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Fechar janela de autenticação"]',
    );

    expect(closeButton).toBeTruthy();
    closeButton?.click();
    await fixture.whenStable();

    expect(closeAuthCardSpy).toHaveBeenCalledTimes(1);
  });

  it('should close when clicking the backdrop but ignore clicks inside the card', async () => {
    isAuthCardOpenSignal.set(true);
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const dialog = compiled.querySelector<HTMLElement>('[data-testid="auth-card"]');
    const backdrop = compiled.querySelector<HTMLElement>('[data-testid="auth-card-backdrop"]');

    dialog?.click();
    expect(closeAuthCardSpy).not.toHaveBeenCalled();

    backdrop?.click();
    expect(closeAuthCardSpy).toHaveBeenCalledTimes(1);
  });

  it('should close on Escape key only when open', async () => {
    const fixture = TestBed.createComponent(AuthCard);
    await fixture.whenStable();

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeAuthCardSpy).not.toHaveBeenCalled();

    isAuthCardOpenSignal.set(true);
    await fixture.whenStable();

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeAuthCardSpy).toHaveBeenCalledTimes(1);
  });
});
