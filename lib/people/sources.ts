import { createHash } from 'crypto';
import { PeopleSearchParams, PersonHit } from '../types';
import { fetchWithTimeout } from '../http';
import { parseLocation, searchProviders } from '../npi';

/**
 * Keyless public people directories. Each one covers people in a public or
 * professional role — no consumer data brokers, no home addresses.
 *
 * A source returns null when the query doesn't give it enough to search on.
 */
export type Source = {
  id: PersonHit['source'];
  label: string;
  covers: string;
  /** shown when the source is skipped */
  needs: string;
  search: (p: PeopleSearchParams) => Promise<PersonHit[] | null>;
};

const fullName = (p: PeopleSearchParams) => [p.firstName, p.lastName].map((s) => s?.trim()).filter(Boolean).join(' ');
const hasFullName = (p: PeopleSearchParams) => !!(p.firstName?.trim() && p.lastName?.trim());
const title = (s = '') => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithTimeout(url, { ...init, headers: { Accept: 'application/json', ...init.headers } }, 9000);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------- NPI (CMS)

const npi: Source = {
  id: 'npi',
  label: 'NPI Registry',
  covers: 'US healthcare providers',
  needs: 'needs a last name or specialty',
  async search(p) {
    if (!p.lastName?.trim() && !p.specialty?.trim()) return null;
    const { results } = await searchProviders(p);
    return results.map((r) => ({
      source: 'npi',
      id: `npi:${r.npi}`,
      name: r.name,
      headline: [r.credential, r.specialty].filter(Boolean).join(' · '),
      organization: r.kind === 'organization' ? r.name : '',
      location: r.address,
      phone: r.phone,
      email: null,
      url: r.profileUrl,
      links: [],
    }));
  },
};

// ------------------------------------------------------ FINRA BrokerCheck

type FinraHit = {
  _source: {
    ind_source_id: string;
    ind_firstname: string;
    ind_middlename?: string;
    ind_lastname: string;
    ind_bc_scope?: string;
    ind_ia_scope?: string;
    ind_current_employments?: { firm_name: string; branch_city?: string; branch_state?: string }[];
  };
};

const finra: Source = {
  id: 'finra',
  label: 'FINRA BrokerCheck',
  covers: 'licensed brokers & investment advisers',
  needs: 'needs first + last name',
  async search(p) {
    if (!hasFullName(p)) return null;
    const { city, state } = parseLocation(p.location ?? '');
    const qs = new URLSearchParams({ query: fullName(p), hl: 'true', nrows: '12', start: '0', r: '25', wt: 'json' });
    if (city) qs.set('city', city);
    if (state) qs.set('state', state);
    const data = await getJson<{ hits?: { hits: FinraHit[] } }>(`https://api.brokercheck.finra.org/search/individual?${qs}`);
    return (data.hits?.hits ?? []).map(({ _source: s }) => {
      const job = s.ind_current_employments?.[0];
      const roles = [s.ind_bc_scope === 'Active' && 'Broker', s.ind_ia_scope === 'Active' && 'Investment adviser'].filter(Boolean);
      return {
        source: 'finra' as const,
        id: `finra:${s.ind_source_id}`,
        name: title([s.ind_firstname, s.ind_middlename, s.ind_lastname].filter(Boolean).join(' ')),
        headline: roles.length ? roles.join(' · ') : 'Not currently registered',
        organization: job ? title(job.firm_name) : '',
        location: job ? [job.branch_city, job.branch_state].filter(Boolean).join(', ') : '',
        phone: null,
        email: null,
        url: `https://brokercheck.finra.org/individual/summary/${s.ind_source_id}`,
        links: [],
      };
    });
  },
};

// ------------------------------------------------------------------ GitHub

type GhUser = {
  login: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  html_url: string;
};

const github: Source = {
  id: 'github',
  label: 'GitHub',
  covers: 'software developers',
  needs: 'needs first + last name',
  async search(p) {
    if (!hasFullName(p)) return null;
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const { city } = parseLocation(p.location ?? '');
    const q = `fullname:"${fullName(p)}"${city ? ` location:"${city}"` : ''}`;
    const found = await getJson<{ items: { login: string }[] }>(
      `https://api.github.com/search/users?${new URLSearchParams({ q, per_page: '5' })}`,
      { headers }
    );
    // Unauthenticated GitHub allows 60 profile reads/hour, so only the top 5.
    const users = await Promise.all(
      found.items.slice(0, 5).map((u) => getJson<GhUser>(`https://api.github.com/users/${u.login}`, { headers }).catch(() => null))
    );
    return users.filter((u): u is GhUser => !!u).map((u) => {
      const links = [
        u.blog && { label: 'website', url: /^https?:/.test(u.blog) ? u.blog : `https://${u.blog}` },
        u.twitter_username && { label: 'x.com', url: `https://x.com/${u.twitter_username}` },
      ].filter(Boolean) as PersonHit['links'];
      return {
        source: 'github' as const,
        id: `github:${u.login}`,
        name: u.name || u.login,
        headline: u.bio ?? `@${u.login}`,
        organization: u.company?.replace(/^@/, '') ?? '',
        location: u.location ?? '',
        phone: null,
        email: u.email,
        url: u.html_url,
        links,
      };
    });
  },
};

// ------------------------------------------------------------------- ORCID

type OrcidRow = {
  'orcid-id': string;
  'given-names': string | null;
  'family-names': string | null;
  'institution-name': string[];
};

const esc = (s: string) => s.trim().replace(/[^\p{L}\p{N}' -]/gu, '');

const orcid: Source = {
  id: 'orcid',
  label: 'ORCID',
  covers: 'researchers & academics',
  needs: 'needs first + last name',
  async search(p) {
    if (!hasFullName(p)) return null;
    const q = `given-names:"${esc(p.firstName!)}" AND family-name:"${esc(p.lastName!)}"`;
    const data = await getJson<{ 'expanded-result': OrcidRow[] | null }>(
      `https://pub.orcid.org/v3.0/expanded-search/?${new URLSearchParams({ q, rows: '10' })}`
    );
    return (data['expanded-result'] ?? []).map((r) => ({
      source: 'orcid' as const,
      id: `orcid:${r['orcid-id']}`,
      name: [r['given-names'], r['family-names']].filter(Boolean).join(' '),
      headline: 'Researcher',
      organization: r['institution-name'].slice(0, 3).join(' · '),
      location: '',
      phone: null,
      email: null,
      url: `https://orcid.org/${r['orcid-id']}`,
      links: [],
    }));
  },
};

// ---------------------------------------------------------------- Wikidata

const wikidata: Source = {
  id: 'wikidata',
  label: 'Wikidata',
  covers: 'notable people (execs, officials, public figures)',
  needs: 'needs first + last name',
  async search(p) {
    if (!hasFullName(p)) return null;
    const search = await getJson<{ query: { search: { title: string }[] } }>(
      `https://www.wikidata.org/w/api.php?${new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: `"${fullName(p)}" haswbstatement:P31=Q5`,
        srlimit: '6',
        format: 'json',
      })}`
    );
    const ids = search.query.search.map((s) => s.title);
    if (!ids.length) return [];
    const ent = await getJson<{
      entities: Record<string, { labels?: { en?: { value: string } }; descriptions?: { en?: { value: string } }; sitelinks?: { enwiki?: { title: string } } }>;
    }>(
      `https://www.wikidata.org/w/api.php?${new URLSearchParams({
        action: 'wbgetentities',
        ids: ids.join('|'),
        props: 'labels|descriptions|sitelinks',
        languages: 'en',
        sitefilter: 'enwiki',
        format: 'json',
      })}`
    );
    return ids.map((id) => {
      const e = ent.entities[id] ?? {};
      const wiki = e.sitelinks?.enwiki?.title;
      return {
        source: 'wikidata' as const,
        id: `wikidata:${id}`,
        name: e.labels?.en?.value ?? id,
        headline: e.descriptions?.en?.value ?? '',
        organization: '',
        location: '',
        phone: null,
        email: null,
        url: `https://www.wikidata.org/wiki/${id}`,
        links: wiki ? [{ label: 'wikipedia', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.replace(/ /g, '_'))}` }] : [],
      };
    });
  },
};

// ---------------------------------------------------------------- Gravatar

type GravatarProfile = {
  display_name?: string;
  profile_url: string;
  location?: string;
  job_title?: string;
  company?: string;
  description?: string;
  verified_accounts?: { service_label: string; url: string }[];
};

const gravatar: Source = {
  id: 'gravatar',
  label: 'Gravatar',
  covers: 'public profile linked to an email',
  needs: 'needs an email',
  async search(p) {
    const email = p.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) return null;
    const hash = createHash('sha256').update(email).digest('hex');
    const res = await fetchWithTimeout(`https://api.gravatar.com/v3/profiles/${hash}`, { headers: { Accept: 'application/json' } }, 8000);
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const g = (await res.json()) as GravatarProfile;
    return [
      {
        source: 'gravatar',
        id: `gravatar:${hash.slice(0, 12)}`,
        name: g.display_name ?? email,
        headline: [g.job_title, g.description].filter(Boolean).join(' · '),
        organization: g.company ?? '',
        location: g.location ?? '',
        phone: null,
        email,
        url: g.profile_url,
        links: (g.verified_accounts ?? []).map((a) => ({ label: a.service_label.toLowerCase(), url: a.url })),
      },
    ];
  },
};

export const SOURCES: Source[] = [npi, finra, github, orcid, wikidata, gravatar];
