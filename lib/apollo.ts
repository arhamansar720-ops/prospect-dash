import { BusinessLead, BusinessSearchParams } from './types';

/**
 * ---------------------------------------------------------------
 * WIRE-UP POINT: Apollo.io People/Org Search
 * ---------------------------------------------------------------
 * Apollo's "Mixed People API Search" endpoint is what you want here.
 * Docs: https://docs.apollo.io  (People API Search)
 *
 * 1. Create an API route at app/api/business-search/route.ts that
 *    forwards to Apollo using your API key from an env var
 *    (APOLLO_API_KEY) — never call Apollo directly from the client,
 *    your key would be exposed in the browser.
 * 2. Replace the fetch() call below to hit your own /api/business-search
 *    route instead of returning mock data.
 *
 * Example server-side call shape (inside the API route):
 *
 *   const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'X-Api-Key': process.env.APOLLO_API_KEY!,
 *     },
 *     body: JSON.stringify({
 *       q_person_name: params.name,
 *       organization_name: params.company,
 *       person_titles: params.title ? [params.title] : undefined,
 *     }),
 *   });
 * ---------------------------------------------------------------
 */

const MOCK_LEADS: BusinessLead[] = [
  {
    id: 'b1',
    name: 'Dana Whitfield',
    title: 'VP of Operations',
    company: 'Harbor Logistics Co.',
    email: 'd.whitfield@harborlogistics.com',
    phone: '(713) 555-0142',
    location: 'Houston, TX',
    matchConfidence: 'high',
  },
  {
    id: 'b2',
    name: 'Marcus Ellery',
    title: 'Director of Procurement',
    company: 'Crestline Manufacturing',
    email: 'mellery@crestlinemfg.com',
    phone: null,
    location: 'Sugar Land, TX',
    matchConfidence: 'medium',
  },
  {
    id: 'b3',
    name: 'Priya Nadarajah',
    title: 'Owner',
    company: 'Nadarajah & Sons Builders',
    email: null,
    phone: '(281) 555-0199',
    location: 'Katy, TX',
    matchConfidence: 'low',
  },
];

export async function searchBusinessLeads(
  params: BusinessSearchParams
): Promise<BusinessLead[]> {
  if (!params.name && !params.company && !params.title && !params.location) {
    return [];
  }

  const res = await fetch('/api/business-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    console.error('business-search error', await res.text());
    return MOCK_LEADS;
  }

  return res.json();
}
