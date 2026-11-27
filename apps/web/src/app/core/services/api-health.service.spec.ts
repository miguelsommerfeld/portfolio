import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@config/api.config';
import { ApiHealthService } from './api-health.service';

describe('ApiHealthService', () => {
  let service: ApiHealthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiHealthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should return true when GET /health responds with status ok', () => {
    let result: boolean | undefined;

    service.check().subscribe((isHealthy) => (result = isHealthy));

    const req = httpTesting.expectOne(`${API_BASE_URL}/health`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(false);

    req.flush({ status: 'ok' });

    expect(result).toBe(true);
  });

  it('should return false when GET /health fails with network or server error', () => {
    let networkResult: boolean | undefined;
    let serverResult: boolean | undefined;

    service.check().subscribe((isHealthy) => (networkResult = isHealthy));
    httpTesting.expectOne(`${API_BASE_URL}/health`).error(new ProgressEvent('error'));
    expect(networkResult).toBe(false);

    service.check().subscribe((isHealthy) => (serverResult = isHealthy));
    httpTesting.expectOne(`${API_BASE_URL}/health`).flush(null, { status: 503, statusText: 'Service Unavailable' });
    expect(serverResult).toBe(false);
  });

  it('should return false when GET /health returns an unexpected payload', () => {
    let result: boolean | undefined;

    service.check().subscribe((isHealthy) => (result = isHealthy));

    httpTesting.expectOne(`${API_BASE_URL}/health`).flush({ status: 'degraded' });

    expect(result).toBe(false);
  });
});
