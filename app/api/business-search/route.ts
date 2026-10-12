import { NextRequest } from 'next/server';
import { errorResponse, searchPeople, toLeadSummary } from '@/lib/apolloServer';

const PER_PAGE = 25;

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();
    const page = Math.max(1, Number(params.page) || 1);
    const company = (params.company ?? '').trim();
    // People API Search has no free-text company-name filter; a bare domain
    // (e.g. "acme.com") is matched exactly, anything else goes to keywords.
    const isDomain = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(company);

    const data = await searchPeople({
      q_person_name: params.name?.trim(),
      person_titles: params.title?.trim() ? [params.title.trim()] : undefined,
      person_locations: params.location?.trim() ? [params.location.trim()] : undefined,
      q_organization_domains_list: isDomain ? [company] : undefined,
      q_keywords: company && !isDomain ? company : undefined,
      page,
      per_page: PER_PAGE,
    });

    return Response.json({
      results: (data.people ?? []).map(toLeadSummary),
      total: data.total_entries ?? 0,
      page,
      perPage: PER_PAGE,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
