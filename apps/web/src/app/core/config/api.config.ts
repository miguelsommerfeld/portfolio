declare const __API_BASE_URL__: string | undefined;

export interface RuntimeEnv {
  API_BASE_URL?: string;
}

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

const DEFAULT_API_BASE_URL = 'http://localhost:3333';

function normalizeApiBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

export function resolveApiBaseUrl(
  runtimeEnv: RuntimeEnv | undefined = typeof window !== 'undefined' ? window.__ENV__ : undefined,
  buildTimeUrl: string | undefined = typeof __API_BASE_URL__ === 'string' ? __API_BASE_URL__ : undefined,
): string {
  return normalizeApiBaseUrl(runtimeEnv?.API_BASE_URL) ?? normalizeApiBaseUrl(buildTimeUrl) ?? DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
