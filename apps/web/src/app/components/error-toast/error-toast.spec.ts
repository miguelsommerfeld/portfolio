import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from '@services/error-feedback.service';
import { ErrorToast } from './error-toast';

describe('ErrorToast', () => {
  let messageSignal: ReturnType<typeof signal<string | null>>;
  let dismissSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    messageSignal = signal<string | null>(null);
    dismissSpy = vi.fn(() => messageSignal.set(null));

    await TestBed.configureTestingModule({
      imports: [ErrorToast],
      providers: [
        {
          provide: ErrorFeedbackService,
          useValue: {
            message: messageSignal.asReadonly(),
            dismiss: dismissSpy,
          },
        },
      ],
    }).compileComponents();
  });

  it('should not render when there is no active error message', async () => {
    const fixture = TestBed.createComponent(ErrorToast);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="error-toast"]')).toBeNull();
  });

  it('should render the liquid glass toast alert and dismiss on close click', async () => {
    messageSignal.set(GENERIC_API_ERROR_MESSAGE);
    const fixture = TestBed.createComponent(ErrorToast);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const toast = compiled.querySelector<HTMLElement>('[data-testid="error-toast"]');
    const closeButton = compiled.querySelector<HTMLButtonElement>('button[aria-label="Fechar aviso de erro"]');

    expect(toast).toBeTruthy();
    expect(toast?.getAttribute('role')).toBe('alert');
    expect(toast?.textContent).toContain(GENERIC_API_ERROR_MESSAGE);
    expect(toast?.className).toContain('backdrop-blur-2xl');

    closeButton?.click();
    await fixture.whenStable();

    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(compiled.querySelector('[data-testid="error-toast"]')).toBeNull();
  });
});
