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

export type PeopleSearchResult = {
  results: Provider[];
  total: number;
};
