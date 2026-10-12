import { NextRequest } from 'next/server';
import { errorResponse, searchPeople, toLeadSummary } from '@/lib/apolloServer';

const PER_PAGE = 25;

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();
    const page = Math.max(1, Number(params.page) || 1);

    const data = await searchPeople({
      q_person_name: params.name?.trim(),
      q_keywords: params.keywords?.trim(),
      person_locations: params.city?.trim() ? [params.city.trim()] : undefined,
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
