/** A search hit. Contact details are hidden until the lead is revealed. */
export type BusinessLead = {
  id: string;
  name: string;
  title: string;
  company: string;
  hasEmail: boolean;
  hasPhone: boolean;
};

/** Full record from Apollo people enrichment (costs credits). */
export type RevealedLead = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string | null;
  emailStatus: string | null;
  phone: string | null;
  location: string;
  linkedinUrl: string | null;
};

export type SearchResult<T> = {
  results: T[];
  total: number;
  page: number;
  perPage: number;
};

export type BusinessSearchParams = {
  name?: string;
  company?: string;
  title?: string;
  location?: string;
};

export type PeopleSearchParams = {
  name?: string;
  keywords?: string;
  city?: string;
};
