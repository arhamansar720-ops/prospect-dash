import { PersonRecord, PeopleSearchParams } from './types';

/**
 * ---------------------------------------------------------------
 * WIRE-UP POINT: People search (name / phone / address)
 * ---------------------------------------------------------------
 * There's no single "Apollo for consumers" — providers in this space
 * include things like Endato, IDI Data, BeenVerified's business API,
 * or Whitepages Pro. They all require a business account + signed
 * permissible-use agreement (most are FCRA-gated if results could be
 * used for credit/employment/tenant decisions — for pure personal
 * lookups that restriction usually doesn't apply, but read whichever
 * provider's terms before going live).
 *
 * Same pattern as apollo.ts:
 * 1. Add app/api/people-search/route.ts as a server-side proxy that
 *    holds your provider API key in an env var.
 * 2. Swap the mock below for a fetch() to that route.
 * ---------------------------------------------------------------
 */

const MOCK_PEOPLE: PersonRecord[] = [
  {
    id: 'p1',
    name: 'Jordan T. Caldwell',
    age: 34,
    phones: ['(832) 555-0118', '(281) 555-0173'],
    addresses: ['4821 Birchcrest Ln, Sugar Land, TX 77479'],
    relatedTo: ['Renee Caldwell', 'Marcus Caldwell'],
    matchConfidence: 'high',
  },
  {
    id: 'p2',
    name: 'J. Caldwell',
    age: 61,
    phones: ['(713) 555-0042'],
    addresses: ['118 Maplewood Dr, Houston, TX 77042', '92 Cedar Ridge Ct, Pearland, TX 77584'],
    relatedTo: [],
    matchConfidence: 'medium',
  },
];

export async function searchPeople(
  params: PeopleSearchParams
): Promise<PersonRecord[]> {
  await new Promise((r) => setTimeout(r, 600));

  if (!params.name && !params.phone && !params.address) {
    return [];
  }

  // TODO: replace with `const res = await fetch('/api/people-search', {...})`
  return MOCK_PEOPLE;
}
