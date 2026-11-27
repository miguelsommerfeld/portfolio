import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(ErrorFeedbackService).dismiss();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the persistent navbar above router-outlet and mount auth, resume, and error toast overlays', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const navbar = compiled.querySelector('app-navbar');
    const routerOutlet = compiled.querySelector('router-outlet');
    const authCard = compiled.querySelector('app-auth-card');
    const resumeCard = compiled.querySelector('app-resume-card');
    const errorToast = compiled.querySelector('app-error-toast');

    expect(navbar).toBeTruthy();
    expect(routerOutlet).toBeTruthy();
    expect(authCard).toBeTruthy();
    expect(resumeCard).toBeTruthy();
    expect(errorToast).toBeTruthy();
    expect(navbar!.compareDocumentPosition(routerOutlet!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should redirect /login?error=... to / and display a generic error without leaking the backend code', async () => {
    const router = TestBed.inject(Router);
    const errorFeedback = TestBed.inject(ErrorFeedbackService);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/login?error=oauth_provider_not_configured');
    await fixture.whenStable();

    expect(router.url).toBe('/');
    expect(errorFeedback.message()).toBe(GENERIC_API_ERROR_MESSAGE);
    expect(errorFeedback.message()).not.toContain('oauth_provider_not_configured');
  });
});
