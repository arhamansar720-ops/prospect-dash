import { NextRequest } from 'next/server';
import { apolloPost, errorResponse } from '@/lib/apolloServer';

type MatchResponse = {
  person?: {
    id: string;
    name?: string;
    title?: string;
    email?: string | null;
    email_status?: string | null;
    linkedin_url?: string | null;
    city?: string;
    state?: string;
    country?: string;
    phone_numbers?: { sanitized_number?: string; raw_number?: string }[];
    organization?: { name?: string; phone?: string; primary_phone?: { number?: string } };
  } | null;
};

// Reveals a single person's contact details. Uses ~1 Apollo credit per call
// when an email is found (mobile numbers are not requested — those cost 8).
export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Missing person id' }, { status: 400 });
    }

    const data = await apolloPost<MatchResponse>('/people/match', {
      id,
      reveal_personal_emails: false,
      reveal_phone_number: false,
    });

    const p = data.person;
    if (!p) return Response.json({ error: 'Apollo could not match this person.' }, { status: 404 });

    const phone =
      p.phone_numbers?.[0]?.sanitized_number ??
      p.phone_numbers?.[0]?.raw_number ??
      p.organization?.primary_phone?.number ??
      p.organization?.phone ??
      null;

    return Response.json({
      id: p.id,
      name: p.name ?? '',
      title: p.title ?? '',
      company: p.organization?.name ?? '',
      email: p.email && !p.email.startsWith('email_not_unlocked') ? p.email : null,
      emailStatus: p.email_status ?? null,
      phone,
      location: [p.city, p.state, p.country].filter(Boolean).join(', '),
      linkedinUrl: p.linkedin_url ?? null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
