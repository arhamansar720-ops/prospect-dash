// Server-only helpers shared by the API routes.

export const USER_AGENT = 'prospect-dash/0.3 (+https://prospect-dash.vercel.app)';

export class ApiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  const status = e instanceof ApiError ? e.status : 500;
  const message = e instanceof Error ? e.message : 'Unknown error';
  return Response.json({ error: message }, { status });
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      cache: 'no-store',
      headers: { 'User-Agent': USER_AGENT, ...init.headers },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Turns "acme.com", "https://www.acme.com/about" etc. into "acme.com". */
export function normalizeDomain(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    // Public hostnames only — no IP literals, localhost or single-label names.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) || /^\d+(\.\d+)+$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}
