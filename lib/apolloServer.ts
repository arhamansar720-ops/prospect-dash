/**
 * Server-only Apollo helpers. Never import this from a client component —
 * it reads APOLLO_API_KEY.
 *
 * Endpoints used (both available on Apollo's free plan):
 *   POST /api/v1/mixed_people/api_search — 0 credits, no emails/phones,
 *        last names come back obfuscated ("Hu***n").
 *   POST /api/v1/people/match            — reveals one person, ~1 credit.
 *
 * The old /v1/mixed_people/search endpoint is paid-plan only and returns
 * 403 API_INACCESSIBLE on free accounts.
 */

const BASE = 'https://api.apollo.io/api/v1';

export class ApolloError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type QueryValue = string | number | boolean | string[] | undefined;

export async function apolloPost<T>(path: string, query: Record<string, QueryValue>): Promise<T> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new ApolloError('APOLLO_API_KEY is not set in the Vercel project environment.', 500);
  }

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(`${key}[]`, v));
    else qs.append(key, String(value));
  }

  const res = await fetch(`${BASE}${path}?${qs}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': apiKey,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON error body
  }

  if (!res.ok) {
    const msg = data?.error || data?.error_details?.message || data?.message || text || res.statusText;
    throw new ApolloError(`Apollo ${res.status}: ${msg}`, res.status);
  }

  return data as T;
}

export function errorResponse(e: unknown) {
  const status = e instanceof ApolloError ? e.status : 500;
  const message = e instanceof Error ? e.message : 'Unknown error';
  return Response.json({ error: message }, { status });
}

export type ApolloSearchPerson = {
  id: string;
  first_name?: string;
  last_name_obfuscated?: string;
  title?: string;
  has_email?: boolean;
  has_direct_phone?: string | boolean;
  organization?: { name?: string };
};

export type ApolloSearchResponse = {
  total_entries?: number;
  people?: ApolloSearchPerson[];
};

export function searchPeople(query: Record<string, QueryValue>) {
  return apolloPost<ApolloSearchResponse>('/mixed_people/api_search', query);
}

export function toLeadSummary(p: ApolloSearchPerson) {
  return {
    id: p.id,
    name: [p.first_name, p.last_name_obfuscated].filter(Boolean).join(' ') || 'Unknown',
    title: p.title ?? '',
    company: p.organization?.name ?? '',
    hasEmail: !!p.has_email,
    hasPhone: p.has_direct_phone === true || p.has_direct_phone === 'Yes',
  };
}
