import { PeopleSearchParams, Provider } from './types';
import { ApiError, fetchWithTimeout } from './http';

// CMS NPI Registry — free, keyless, official. Covers US healthcare providers
// (individuals and organizations) with practice address and phone.
// Docs: https://npiregistry.cms.hhs.gov/api-page
const NPI = 'https://npiregistry.cms.hhs.gov/api/';

type NpiAddress = {
  address_purpose: 'LOCATION' | 'MAILING';
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postal_code: string;
  telephone_number?: string;
};

type NpiResult = {
  number: string | number;
  enumeration_type: 'NPI-1' | 'NPI-2';
  basic: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    credential?: string;
    organization_name?: string;
    status?: string;
  };
  addresses: NpiAddress[];
  taxonomies: { desc: string; primary: boolean }[];
};

const title = (s = '') => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** "Houston, TX" → { city: "Houston", state: "TX" }; "TX" → { state: "TX" } */
function parseLocation(location: string) {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  if (/^[a-z]{2}$/i.test(last)) {
    return { city: parts.slice(0, -1).join(' ') || undefined, state: last.toUpperCase() };
  }
  return { city: parts.join(' ') || undefined, state: undefined };
}

/** Exact match by default; a trailing * (min 2 letters) does prefix matching. */
function nameParam(v?: string) {
  const s = v?.trim().replace(/[^a-z' *-]/gi, '');
  return s && s.replace(/\*/g, '').length >= 2 ? s : undefined;
}

function toProvider(r: NpiResult): Provider {
  const b = r.basic;
  const loc = r.addresses.find((a) => a.address_purpose === 'LOCATION') ?? r.addresses[0];
  const isOrg = r.enumeration_type === 'NPI-2';
  const zip = loc?.postal_code?.slice(0, 5);
  return {
    npi: String(r.number),
    name: isOrg
      ? title(b.organization_name)
      : [b.first_name, b.middle_name?.[0] && `${b.middle_name[0]}.`, b.last_name].filter(Boolean).map((s) => title(s!)).join(' '),
    credential: isOrg ? '' : (b.credential ?? '').replace(/\./g, '').toUpperCase(),
    kind: isOrg ? 'organization' : 'individual',
    specialty: (r.taxonomies.find((t) => t.primary) ?? r.taxonomies[0])?.desc ?? '',
    address: loc
      ? [title(loc.address_1), loc.address_2 && title(loc.address_2), `${title(loc.city)}, ${loc.state} ${zip}`]
          .filter(Boolean)
          .join(', ')
      : '',
    phone: loc?.telephone_number || null,
    profileUrl: `https://npiregistry.cms.hhs.gov/provider-view/${r.number}`,
  };
}

export async function searchProviders(p: PeopleSearchParams) {
  const { city, state } = parseLocation(p.location ?? '');
  const firstName = nameParam(p.firstName);
  const lastName = nameParam(p.lastName);
  const specialty = p.specialty?.trim();

  if (!firstName && !lastName && !specialty) {
    throw new ApiError('Enter a name or a specialty.', 400);
  }

  const params = new URLSearchParams({ version: '2.1', limit: '200' });
  if (firstName) params.set('first_name', firstName);
  if (lastName) params.set('last_name', lastName);
  if (specialty) params.set('taxonomy_description', specialty);
  if (city) params.set('city', city);
  if (state) params.set('state', state);

  const res = await fetchWithTimeout(`${NPI}?${params}`, {}, 15000);
  if (!res.ok) throw new ApiError(`NPI Registry error (${res.status})`, 502);
  const data = (await res.json()) as { result_count?: number; results?: NpiResult[]; Errors?: { description: string }[] };
  if (data.Errors?.length) throw new ApiError(data.Errors.map((e) => e.description).join('; '), 400);

  let results = (data.results ?? []).filter((r) => r.basic.status !== 'D').map(toProvider);

  // The registry matches city/state against mailing addresses too; keep only
  // providers who actually practice there.
  if (city || state) {
    const c = city?.toLowerCase();
    results = results.filter((r) => {
      const a = r.address.toLowerCase();
      return (!c || a.includes(`${c},`)) && (!state || a.includes(`, ${state.toLowerCase()} `));
    });
  }

  return { results, total: results.length };
}
