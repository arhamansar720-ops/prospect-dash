import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/http';
import { searchAllPeople } from '@/lib/people';

export const maxDuration = 30;

async function handle(input: Record<string, string | undefined>) {
  try {
    return Response.json(
      await searchAllPeople({
        firstName: input.firstName,
        lastName: input.lastName,
        specialty: input.specialty,
        location: input.location,
        email: input.email,
      })
    );
  } catch (e) {
    return errorResponse(e);
  }
}

// GET /api/people-search?firstName=john&lastName=smith&location=Houston,%20TX[&specialty=][&email=]
export async function GET(req: NextRequest) {
  return handle(Object.fromEntries(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  return handle(await req.json().catch(() => ({})));
}
