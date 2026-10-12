export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return Response.json({ connected: false, reason: 'APOLLO_API_KEY not set' });

  try {
    const res = await fetch('https://api.apollo.io/v1/auth/health', {
      headers: { 'x-api-key': apiKey, 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    const connected = res.ok && data?.is_logged_in !== false;
    return Response.json({ connected, reason: connected ? null : 'Apollo rejected the API key' });
  } catch {
    return Response.json({ connected: false, reason: 'Could not reach Apollo' });
  }
}
