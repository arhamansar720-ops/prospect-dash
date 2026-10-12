import {
  BusinessSearchParams,
  BusinessSearchResult,
  EmailFinderParams,
  EmailFinderResult,
  SiteContacts,
} from './types';

// Client-side wrappers around our own API routes.

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const searchBusinesses = (params: BusinessSearchParams) =>
  post<BusinessSearchResult>('/api/business-search', params);

export const getSiteContacts = (website: string) => post<SiteContacts>('/api/site-contacts', { website });

export const findEmail = (params: EmailFinderParams) => post<EmailFinderResult>('/api/email-finder', params);
