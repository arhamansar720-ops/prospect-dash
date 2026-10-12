import { NextRequest, NextResponse } from 'next/server';

// The /api/* routes are a public, keyless API — allow calls from any origin.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: CORS });
  const res = NextResponse.next();
  Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: '/api/:path*' };
