import { BusinessLead, BusinessSearchParams, PeopleSearchParams, RevealedLead, SearchResult } from './types';

// Client-side wrappers around our own API routes. The Apollo key only
// lives on the server (app/api/*, lib/apolloServer.ts).

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

export function searchBusinessLeads(params: BusinessSearchParams, page = 1) {
  return post<SearchResult<BusinessLead>>('/api/business-search', { ...params, page });
}

export function searchPeople(params: PeopleSearchParams, page = 1) {
  return post<SearchResult<BusinessLead>>('/api/people-search', { ...params, page });
}

export function revealLead(id: string) {
  return post<RevealedLead>('/api/enrich', { id });
}
