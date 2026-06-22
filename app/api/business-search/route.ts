import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'APOLLO_API_KEY not configured' }, { status: 500 });
  }

  const params = await req.json();

  const body: Record<string, unknown> = {
    page: 1,
    per_page: 10,
  };
  if (params.name) body.q_person_name = params.name;
  if (params.company) body.organization_name = params.company;
  if (params.title) body.person_titles = [params.title];
  if (params.location) body.person_locations = [params.location];

  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const people = (data.people ?? []) as Record<string, unknown>[];

  const leads = people.map((p, i) => ({
    id: (p.id as string) ?? `r${i}`,
    name: (p.name as string) ?? 'Unknown',
    title: (p.title as string) ?? '',
    company: ((p.organization as Record<string, unknown>)?.name as string) ?? '',
    email: (p.email as string | null) ?? null,
    phone: ((p.phone_numbers as { raw_number: string }[])?.[0]?.raw_number) ?? null,
    location: [p.city, p.state].filter(Boolean).join(', ') || '',
    matchConfidence: i === 0 ? 'high' : i < 3 ? 'medium' : 'low',
  }));

  return NextResponse.json(leads);
}
