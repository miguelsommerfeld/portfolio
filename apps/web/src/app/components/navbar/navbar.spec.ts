import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let isAuthenticatedSignal: ReturnType<typeof signal<boolean>>;
  let isLoggingOutSignal: ReturnType<typeof signal<boolean>>;
  let logoutSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    isAuthenticatedSignal = signal(false);
    isLoggingOutSignal = signal(false);
    logoutSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: isAuthenticatedSignal.asReadonly(),
            isLoggingOut: isLoggingOutSignal.asReadonly(),
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

  it('should render the GitHub repository link with icon image and security attributes', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const githubLink = compiled.querySelector<HTMLAnchorElement>('a[aria-label="Repositório no GitHub"]');
    const githubIcon = githubLink?.querySelector<HTMLImageElement>('img');

    expect(githubLink).toBeTruthy();
    expect(githubLink?.getAttribute('href')).toBe('https://github.com/miguelsommerfeld/portfolio');
    expect(githubLink?.getAttribute('target')).toBe('_blank');
    expect(githubLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(githubIcon?.getAttribute('src')).toBe('/icons/github.png');
    expect(githubIcon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render Auth link pointing to /login when unauthenticated', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const authLink = compiled.querySelector<HTMLAnchorElement>('a[href="/login"]');
    const logoutButton = compiled.querySelector<HTMLButtonElement>('button');

    expect(authLink).toBeTruthy();
    expect(authLink?.textContent?.trim()).toBe('Auth');
    expect(logoutButton).toBeNull();
  });

  it('should replace Auth with Logout button when authenticated and call logout on click', async () => {
    isAuthenticatedSignal.set(true);
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const authLink = compiled.querySelector<HTMLAnchorElement>('a[href="/login"]');
    const logoutButton = compiled.querySelector<HTMLButtonElement>('button');

    expect(authLink).toBeNull();
    expect(logoutButton).toBeTruthy();
    expect(logoutButton?.textContent?.trim()).toBe('Logout');
    expect(logoutButton?.disabled).toBe(false);

    logoutButton?.click();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
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
