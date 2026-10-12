import { Business } from './types';
import { ApiError, fetchWithTimeout } from './http';

// Free, keyless public APIs. Nominatim: max ~1 req/s. Overpass: fair use.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];

const CATEGORY_KEYS = ['shop', 'amenity', 'office', 'craft', 'healthcare', 'tourism', 'leisure'];
const NOMINATIM_KEYS = ['amenity', 'shop', 'office', 'healthcare'];
const NON_BUSINESS = new Set(['highway', 'boundary', 'place', 'landuse', 'natural', 'waterway', 'railway', 'route']);
const MAX_RESULTS = 100;

export type Bbox = { south: number; west: number; north: number; east: number; label: string };

export async function geocode(location: string): Promise<Bbox> {
  const url = `${NOMINATIM}?${new URLSearchParams({ q: location, format: 'json', limit: '1' })}`;
  const res = await fetchWithTimeout(url, {}, 8000);
  if (!res.ok) throw new ApiError(`Location lookup failed (${res.status})`, 502);
  const [hit] = (await res.json()) as { boundingbox: string[]; display_name: string }[];
  if (!hit) throw new ApiError(`Couldn't find the location "${location}".`, 404);
  const [south, north, west, east] = hit.boundingbox.map(Number);
  return { south, west, north, east, label: hit.display_name };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&');
}

/** "Dentists" → ["dentists", "dentist"]; "Real Estate" → ["real_estate"] */
function tagValues(category: string) {
  const v = category.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
  const out = new Set([v]);
  if (v.endsWith('ies')) out.add(`${v.slice(0, -3)}y`);
  else if (v.endsWith('s')) out.add(v.slice(0, -1));
  if (v.endsWith('ing')) out.add(`${v.slice(0, -3)}er`); // roofing → roofer
  return Array.from(out).filter(Boolean);
}

/** "plumber" → "plumb", "roofing" → "roof" — used to match names like "Smith Plumbing". */
function stem(category: string) {
  const w = category.trim().toLowerCase();
  const s = w.replace(/(ers|ing|er|s)$/, '');
  return s.length >= 4 && !s.includes(' ') ? s : w;
}

/** Name-search forms for Nominatim, e.g. "plumber" → ["plumber", "plumbing"]. */
function nameVariants(category: string) {
  const w = category.trim().toLowerCase();
  const out = new Set([w]);
  const s = stem(w);
  if (s !== w && /(ers?|ing)$/.test(w)) {
    out.add(`${s}ing`);
    out.add(`${s}er`);
  }
  return Array.from(out);
}

function buildQuery(bbox: Bbox, category: string, name: string) {
  const b = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
  const nameFilter = name ? `["name"~"${escapeRegex(name)}",i]` : '["name"]';
  const clauses: string[] = [];

  if (category) {
    for (const key of CATEGORY_KEYS) {
      for (const v of tagValues(category)) clauses.push(`nwr["${key}"="${v}"]${nameFilter}${b};`);
    }
    // Also catch businesses whose name contains the category, e.g. "Smith Roofing".
    const word = escapeRegex(stem(category));
    clauses.push(`nwr["name"~"${word}",i]${name ? nameFilter : ''}${b};`);
  } else {
    clauses.push(`nwr${nameFilter}${b};`);
  }

  return `[out:json][timeout:15];(${clauses.join('')});out center tags ${MAX_RESULTS + 1};`;
}

type OsmElement = { type: string; id: number; tags?: Record<string, string> };

function toBusiness(el: OsmElement): Business {
  const t = el.tags ?? {};
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const cityLine = [t['addr:city'], [t['addr:state'], t['addr:postcode']].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  const category = CATEGORY_KEYS.map((k) => t[k]).find(Boolean) ?? '';
  let website = t.website || t['contact:website'] || t.url || null;
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  return {
    id: `${el.type}/${el.id}`,
    name: t.name ?? 'Unnamed',
    category: category.replace(/_/g, ' '),
    address: [street, cityLine].filter(Boolean).join(', '),
    phone: t.phone || t['contact:phone'] || null,
    email: t.email || t['contact:email'] || null,
    website,
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

async function overpassSearch(bbox: Bbox, category: string, name: string): Promise<Business[]> {
  const query = buildQuery(bbox, category, name);
  const deadline = Date.now() + 15000; // public Overpass is often overloaded; don't hold the search hostage
  let lastError = '';

  for (const endpoint of OVERPASS) {
    const remaining = deadline - Date.now();
    if (remaining < 2000) break;
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: query }),
        },
        remaining
      );
      if (!res.ok) {
        lastError = `Overpass ${res.status}`;
        continue;
      }
      const data = (await res.json()) as { elements: OsmElement[] };
      return data.elements.map(toBusiness);
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'request failed';
    }
  }
  throw new ApiError(lastError, 503);
}

type NominatimHit = {
  osm_type: string;
  osm_id: number;
  name: string;
  category: string;
  type: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Nominatim is slower to cover but far more reliable than the public
 * Overpass servers. Its usage policy allows ~1 request/second, so the
 * queries run sequentially.
 */
async function nominatimSearch(bbox: Bbox, category: string, name: string): Promise<Business[]> {
  const queries: string[] = [];
  if (category) {
    const values = tagValues(category);
    const v = values[values.length - 1];
    for (const key of NOMINATIM_KEYS) queries.push(`[${key}=${v}]`);
    queries.push(...nameVariants(category));
  }
  if (name) queries.push(name);

  const viewbox = `${bbox.west},${bbox.north},${bbox.east},${bbox.south}`;
  const out: Business[] = [];

  for (const q of queries) {
    await sleep(1100);
    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      limit: '40',
      extratags: '1',
      addressdetails: '1',
      layer: 'poi',
      viewbox,
      bounded: '1',
    });
    try {
      const res = await fetchWithTimeout(`${NOMINATIM}?${params}`, {}, 8000);
      if (!res.ok) continue;
      const hits = (await res.json()) as NominatimHit[];
      for (const h of hits) {
        if (!h.name || NON_BUSINESS.has(h.category)) continue;
        const a = h.address ?? {};
        const tags: Record<string, string> = {
          ...(h.extratags ?? {}),
          name: h.name,
          [h.category]: h.type,
          ...(a.house_number && { 'addr:housenumber': a.house_number }),
          ...(a.road && { 'addr:street': a.road }),
          ...((a.city || a.town || a.village || a.suburb) && {
            'addr:city': a.city || a.town || a.village || a.suburb,
          }),
          ...(a.state && { 'addr:state': a.state }),
          ...(a.postcode && { 'addr:postcode': a.postcode }),
        };
        out.push(toBusiness({ type: h.osm_type, id: h.osm_id, tags }));
      }
    } catch {
      // skip this query, keep the others
    }
  }
  return out;
}

export async function searchBusinesses(bbox: Bbox, category: string, name: string) {
  const [overpass, nominatim] = await Promise.allSettled([
    overpassSearch(bbox, category, name),
    nominatimSearch(bbox, category, name),
  ]);

  if (overpass.status === 'rejected' && nominatim.status === 'rejected') {
    throw new ApiError('OpenStreetMap search is busy, try again in a moment.', 503);
  }

  // Merge, preferring whichever copy has more contact info.
  const byId = new Map<string, Business>();
  for (const r of [overpass, nominatim]) {
    if (r.status !== 'fulfilled') continue;
    for (const b of r.value) {
      const prev = byId.get(b.id);
      if (!prev || score(b) > score(prev)) byId.set(b.id, b);
    }
  }

  let results = Array.from(byId.values());
  if (name) {
    const needle = name.toLowerCase();
    results = results.filter((b) => b.name.toLowerCase().includes(needle));
  }
  // Businesses with contact info first.
  results.sort((a, b) => score(b) - score(a));

  return {
    results: results.slice(0, MAX_RESULTS),
    truncated: results.length > MAX_RESULTS,
    partial: overpass.status === 'rejected',
  };
}

function score(b: Business) {
  return (b.website ? 2 : 0) + (b.phone ? 1 : 0) + (b.email ? 1 : 0);
}
