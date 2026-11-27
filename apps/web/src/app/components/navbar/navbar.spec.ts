import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@services/auth.service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let isAuthenticatedSignal: ReturnType<typeof signal<boolean>>;
  let isLoggingOutSignal: ReturnType<typeof signal<boolean>>;
  let openAuthCardSpy: ReturnType<typeof vi.fn>;
  let logoutSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    isAuthenticatedSignal = signal(false);
    isLoggingOutSignal = signal(false);
    openAuthCardSpy = vi.fn();
    logoutSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: isAuthenticatedSignal.asReadonly(),
            isLoggingOut: isLoggingOutSignal.asReadonly(),
            openAuthCard: openAuthCardSpy,
            logout: logoutSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('should render the brand name "Miguel L. Sommerfeld"', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Miguel L. Sommerfeld');
  });

  it('should render the LinkedIn profile link to the left of the GitHub profile link with icon and security attributes', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const linkedinLink = compiled.querySelector<HTMLAnchorElement>('a[aria-label="Perfil no LinkedIn"]');
    const linkedinIcon = linkedinLink?.querySelector<HTMLImageElement>('img');
    const githubLink = compiled.querySelector<HTMLAnchorElement>('a[aria-label="Perfil no GitHub"]');

    expect(linkedinLink).toBeTruthy();
    expect(linkedinLink?.getAttribute('href')).toBe('https://www.linkedin.com/in/miguelsommerfeld/');
    expect(linkedinLink?.getAttribute('target')).toBe('_blank');
    expect(linkedinLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(linkedinIcon?.getAttribute('src')).toBe('/icons/linkedin.png');
    expect(linkedinIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(githubLink).toBeTruthy();
    expect(linkedinLink!.compareDocumentPosition(githubLink!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should render the GitHub profile link with icon image and security attributes', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const githubLink = compiled.querySelector<HTMLAnchorElement>('a[aria-label="Perfil no GitHub"]');
    const githubIcon = githubLink?.querySelector<HTMLImageElement>('img');

    expect(githubLink).toBeTruthy();
    expect(githubLink?.getAttribute('href')).toBe('https://github.com/miguelsommerfeld');
    expect(githubLink?.getAttribute('target')).toBe('_blank');
    expect(githubLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(githubIcon?.getAttribute('src')).toBe('/icons/github.png');
    expect(githubIcon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render Auth button and open auth card on click when unauthenticated', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const authButton = compiled.querySelector<HTMLButtonElement>('button');

    expect(compiled.querySelector('a[href="/login"]')).toBeNull();
    expect(authButton).toBeTruthy();
    expect(authButton?.textContent?.trim()).toBe('Auth');

    authButton?.click();
    expect(openAuthCardSpy).toHaveBeenCalledTimes(1);
    expect(logoutSpy).not.toHaveBeenCalled();
  });

  it('should replace Auth with Logout button when authenticated and call logout on click', async () => {
    isAuthenticatedSignal.set(true);
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector<HTMLButtonElement>('button');

    expect(logoutButton).toBeTruthy();
    expect(logoutButton?.textContent?.trim()).toBe('Logout');
    expect(logoutButton?.disabled).toBe(false);

    logoutButton?.click();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(openAuthCardSpy).not.toHaveBeenCalled();
  });

  it('should disable Logout button while logout is in progress', async () => {
    isAuthenticatedSignal.set(true);
    isLoggingOutSignal.set(true);
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector<HTMLButtonElement>('button');

    expect(logoutButton?.disabled).toBe(true);
  });
});
