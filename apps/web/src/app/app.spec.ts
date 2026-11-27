import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the persistent navbar above router-outlet and mount auth and resume cards', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const navbar = compiled.querySelector('app-navbar');
    const routerOutlet = compiled.querySelector('router-outlet');
    const authCard = compiled.querySelector('app-auth-card');
    const resumeCard = compiled.querySelector('app-resume-card');

    expect(navbar).toBeTruthy();
    expect(routerOutlet).toBeTruthy();
    expect(authCard).toBeTruthy();
    expect(resumeCard).toBeTruthy();
    expect(navbar!.compareDocumentPosition(routerOutlet!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
