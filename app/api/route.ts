// GET /api — machine-readable index of the public API.
export function GET() {
  return Response.json({
    name: 'Prospect Dash API',
    auth: 'none',
    cors: '*',
    endpoints: {
      'GET /api/business-search': {
        params: { category: 'business type, e.g. dentist', location: 'city/area (required)', name: 'optional name filter' },
        example: '/api/business-search?category=dentist&location=Sugar%20Land,%20TX',
        source: 'OpenStreetMap (Nominatim + Overpass)',
      },
      'GET /api/site-contacts': {
        params: { website: 'domain or URL' },
        example: '/api/site-contacts?website=flossdentalsugarland.com',
        source: "the company's own website (+ Hunter.io domain search if configured)",
      },
      'GET /api/email-finder': {
        params: { firstName: '', lastName: '', domain: '' },
        source: 'Hunter.io — requires HUNTER_API_KEY on the server',
      },
      'GET /api/status': { returns: 'which data sources are available' },
    },
    notes: 'All endpoints also accept POST with a JSON body. Business data © OpenStreetMap contributors (ODbL).',
  });
}
