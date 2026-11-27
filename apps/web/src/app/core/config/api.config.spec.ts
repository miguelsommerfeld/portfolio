import { resolveApiBaseUrl } from './api.config';

describe('resolveApiBaseUrl', () => {
  it('should prioritize runtime window env over build-time env and strip trailing slashes', () => {
    expect(resolveApiBaseUrl({ API_BASE_URL: 'https://api.example.com///' }, 'http://localhost:3333')).toBe(
      'https://api.example.com',
    );
  });

  it('should fall back to build-time env when runtime env is empty or missing', () => {
    expect(resolveApiBaseUrl({ API_BASE_URL: '   ' }, 'https://staging-api.example.com/')).toBe(
      'https://staging-api.example.com',
    );
    expect(resolveApiBaseUrl(undefined, 'https://prod-api.example.com')).toBe('https://prod-api.example.com');
  });

  it('should fall back to localhost default when neither runtime nor build-time env is provided', () => {
    expect(resolveApiBaseUrl(undefined, undefined)).toBe('http://localhost:3333');
    expect(resolveApiBaseUrl({ API_BASE_URL: '' }, '  ')).toBe('http://localhost:3333');
  });
});
