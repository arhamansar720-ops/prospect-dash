import { NextRequest } from 'next/server';
import { ApiError, errorResponse, normalizeDomain } from '@/lib/http';
import { scrapeSite } from '@/lib/scrape';
import { domainSearch, hunterConfigured } from '@/lib/hunter';
import { SiteContacts } from '@/lib/types';

export const maxDuration = 30;

async function handle(website: unknown) {
  try {
    const domain = normalizeDomain(String(website ?? ''));
    if (!domain) throw new ApiError('Enter a valid website or domain, e.g. acme.com', 400);

    const [site, hunter] = await Promise.all([
      scrapeSite(domain),
      hunterConfigured()
        ? domainSearch(domain).then(
            (people) => ({ people, status: 'used' as const }),
            (e: Error) => ({ people: [], status: 'error' as const, error: e.message })
          )
        : Promise.resolve({ people: [], status: 'not-configured' as const }),
    ]);

    const result: SiteContacts = {
      domain,
      ...site,
      people: hunter.people,
      hunter: hunter.status,
      hunterError: 'error' in hunter ? hunter.error : undefined,
    };
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}

// GET /api/site-contacts?website=acme.com
export async function GET(req: NextRequest) {
  return handle(req.nextUrl.searchParams.get('website'));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handle(body.website);
}
