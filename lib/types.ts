export type Business = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  osmUrl: string;
};

export type BusinessSearchParams = {
  category?: string;
  name?: string;
  location?: string;
};

export type BusinessSearchResult = {
  results: Business[];
  location: string;
  truncated: boolean;
  /** true when one of the two OSM sources failed, so results may be incomplete */
  partial: boolean;
};

export type HunterPerson = {
  name: string;
  email: string;
  position: string | null;
  confidence: number | null;
  linkedin: string | null;
};

export type SiteContacts = {
  domain: string;
  emails: string[];
  phones: string[];
  socials: string[];
  pagesScanned: string[];
  people: HunterPerson[];
  hunter: 'used' | 'not-configured' | 'error';
  hunterError?: string;
};

export type EmailFinderParams = {
  firstName?: string;
  lastName?: string;
  domain?: string;
};

export type EmailFinderResult = {
  email: string | null;
  score: number | null;
  position: string | null;
  sources: number;
};

export type PeopleSearchParams = {
  firstName?: string;
  lastName?: string;
  specialty?: string;
  location?: string;
  email?: string;
};

/** A healthcare provider from the NPI Registry. */
export type Provider = {
  npi: string;
  name: string;
  credential: string;
  kind: 'individual' | 'organization';
  specialty: string;
  address: string;
  phone: string | null;
  profileUrl: string;
};

export type PersonSourceId = 'npi' | 'finra' | 'github' | 'orcid' | 'wikidata' | 'gravatar';

/** One person record from any public source, normalized. */
export type PersonHit = {
  source: PersonSourceId;
  id: string;
  name: string;
  /** credential, specialty, job title, bio or description */
  headline: string;
  organization: string;
  location: string;
  phone: string | null;
  email: string | null;
  url: string;
  links: { label: string; url: string }[];
};

export type SourceStatus = {
  id: PersonSourceId;
  label: string;
  covers: string;
  status: 'ok' | 'skipped' | 'error';
  count: number;
  note?: string;
};

export type PeopleSearchResult = {
  results: PersonHit[];
  sources: SourceStatus[];
};
