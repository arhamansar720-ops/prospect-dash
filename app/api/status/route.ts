import { hunterConfigured } from '@/lib/hunter';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ osm: true, hunter: hunterConfigured() });
}
