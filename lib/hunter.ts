import { HunterPerson, EmailFinderResult } from './types';
import { ApiError, fetchWithTimeout } from './http';

// Optional: only used when HUNTER_API_KEY is set (free plan = 50 credits/mo).
const BASE = 'https://api.hunter.io/v2';

export const hunterConfigured = () => !!process.env.HUNTER_API_KEY;

async function hunterGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) throw new ApiError('HUNTER_API_KEY is not set.', 400);
  const res = await fetchWithTimeout(`${BASE}${path}?${new URLSearchParams({ ...params, api_key: key })}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.errors?.[0]?.details || body?.errors?.[0]?.id || res.statusText;
    throw new ApiError(`Hunter ${res.status}: ${msg}`, res.status);
  }
  return body.data as T;
}

type DomainSearchData = {
  emails: {
    value: string;
    first_name: string | null;
    last_name: string | null;
    position: string | null;
    confidence: number | null;
    linkedin: string | null;
  }[];
};

export async function domainSearch(domain: string): Promise<HunterPerson[]> {
  const data = await hunterGet<DomainSearchData>('/domain-search', { domain, limit: '10' });
  return data.emails.map((e) => ({
    name: [e.first_name, e.last_name].filter(Boolean).join(' ') || '—',
    email: e.value,
    position: e.position,
    confidence: e.confidence,
    linkedin: e.linkedin,
  }));
}

type EmailFinderData = {
  email: string | null;
  score: number | null;
  position: string | null;
  sources?: unknown[];
};

export async function emailFinder(domain: string, firstName: string, lastName: string): Promise<EmailFinderResult> {
  const d = await hunterGet<EmailFinderData>('/email-finder', {
    domain,
    first_name: firstName,
    last_name: lastName,
  });
  return { email: d.email, score: d.score, position: d.position, sources: d.sources?.length ?? 0 };
}
