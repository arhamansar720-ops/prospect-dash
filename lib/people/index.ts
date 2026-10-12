import { PeopleSearchParams, PeopleSearchResult, SourceStatus } from '../types';
import { ApiError } from '../http';
import { SOURCES } from './sources';
import { parseLocation } from '../npi';

/** Runs every applicable source in parallel; one failing source never fails the search. */
export async function searchAllPeople(p: PeopleSearchParams): Promise<PeopleSearchResult> {
  if (!p.lastName?.trim() && !p.specialty?.trim() && !p.email?.trim()) {
    throw new ApiError('Enter a name, a healthcare specialty, or an email.', 400);
  }

  const settled = await Promise.allSettled(SOURCES.map((s) => s.search(p)));

  const sources: SourceStatus[] = [];
  const results = settled.flatMap((r, i) => {
    const { id, label, covers, needs } = SOURCES[i];
    if (r.status === 'rejected') {
      const note = r.reason instanceof Error ? r.reason.message : 'failed';
      sources.push({ id, label, covers, status: 'error', count: 0, note });
      return [];
    }
    if (r.value === null) {
      sources.push({ id, label, covers, status: 'skipped', count: 0, note: needs });
      return [];
    }
    sources.push({ id, label, covers, status: 'ok', count: r.value.length });
    return r.value;
  });

  // Sources that can't filter by place (ORCID, Wikidata) still return
  // everyone with that name — rank people in the searched city first.
  const { city } = parseLocation(p.location ?? '');
  if (city) {
    const c = city.toLowerCase();
    const local = (loc: string) => (loc.toLowerCase().includes(c) ? 0 : 1);
    results.sort((a, b) => local(a.location) - local(b.location));
  }

  return { results, sources };
}
