import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/http';
import { searchProviders } from '@/lib/npi';

async function handle(input: Record<string, string | undefined>) {
  try {
    return Response.json(
      await searchProviders({
        firstName: input.firstName,
        lastName: input.lastName,
        specialty: input.specialty,
        location: input.location,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}

// GET /api/people-search?lastName=nguyen&specialty=dentist&location=Sugar%20Land,%20TX
export async function GET(req: NextRequest) {
  return handle(Object.fromEntries(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  return handle(await req.json().catch(() => ({})));
}
