import { NextRequest } from 'next/server';
import { ApiError, errorResponse, normalizeDomain } from '@/lib/http';
import { emailFinder, hunterConfigured } from '@/lib/hunter';

async function handle(input: Record<string, string | undefined>) {
  try {
    if (!hunterConfigured()) {
      throw new ApiError(
        'Email finder needs a free Hunter.io key — add HUNTER_API_KEY in Vercel → Settings → Environment Variables.',
        400
      );
    }
    const { firstName, lastName, domain } = input;
    const d = normalizeDomain(String(domain ?? ''));
    if (!firstName?.trim() || !lastName?.trim() || !d) {
      throw new ApiError('First name, last name and company domain are all required.', 400);
    }
    return Response.json(await emailFinder(d, firstName.trim(), lastName.trim()));
  } catch (e) {
    return errorResponse(e);
  }
}

// GET /api/email-finder?firstName=Dana&lastName=Whitfield&domain=acme.com
export async function GET(req: NextRequest) {
  return handle(Object.fromEntries(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  return handle(await req.json().catch(() => ({})));
}
