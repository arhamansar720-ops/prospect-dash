import { NextRequest } from 'next/server';
import { ApiError, errorResponse } from '@/lib/http';
import { geocode, searchBusinesses } from '@/lib/osm';

export const maxDuration = 60;

async function handle(input: Record<string, unknown>) {
  try {
    const category = String(input.category ?? '').trim().slice(0, 60);
    const name = String(input.name ?? '').trim().slice(0, 60);
    const location = String(input.location ?? '').trim().slice(0, 120);

    if (!location) throw new ApiError('Enter a city or area to search in.', 400);
    if (!category && !name) throw new ApiError('Enter a business type or a business name.', 400);

    const bbox = await geocode(location);
    const { results, truncated, partial } = await searchBusinesses(bbox, category, name);
    return Response.json({ results, location: bbox.label, truncated, partial });
  } catch (e) {
    return errorResponse(e);
  }
}

// GET /api/business-search?category=dentist&location=Houston,TX[&name=...]
export async function GET(req: NextRequest) {
  return handle(Object.fromEntries(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  return handle(await req.json().catch(() => ({})));
}
