import { TestBed } from '@angular/core/testing';
import { ErrorFeedbackService, GENERIC_API_ERROR_MESSAGE } from './error-feedback.service';

describe('ErrorFeedbackService', () => {
  let service: ErrorFeedbackService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorFeedbackService);
  });

  afterEach(() => {
    service.dismiss();
    vi.useRealTimers();
  });

  it('should start with no error message and display the generic message on showGenericError', () => {
    expect(service.message()).toBeNull();

    service.showGenericError();

    expect(service.message()).toBe(GENERIC_API_ERROR_MESSAGE);
  });

  it('should dismiss immediately when dismiss is called', () => {
    service.showGenericError();
    expect(service.message()).toBe(GENERIC_API_ERROR_MESSAGE);

    service.dismiss();
    expect(service.message()).toBeNull();
  });

  it('should auto-dismiss after timeout and reset timer on consecutive shows', () => {
    service.showGenericError();
    vi.advanceTimersByTime(4_000);
    expect(service.message()).toBe(GENERIC_API_ERROR_MESSAGE);

    service.showGenericError();
    vi.advanceTimersByTime(4_000);
    expect(service.message()).toBe(GENERIC_API_ERROR_MESSAGE);

    vi.advanceTimersByTime(2_000);
    expect(service.message()).toBeNull();
  });
});
