export type BusinessLead = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string | null;
  phone: string | null;
  location: string;
  matchConfidence: 'high' | 'medium' | 'low';
};

export type PersonRecord = {
  id: string;
  name: string;
  age: number | null;
  phones: string[];
  addresses: string[];
  relatedTo: string[];
  matchConfidence: 'high' | 'medium' | 'low';
};

export type BusinessSearchParams = {
  name?: string;
  company?: string;
  title?: string;
  location?: string;
};

export type PeopleSearchParams = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
};
