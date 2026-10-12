# Prospect Dash

Personal prospecting dashboard that runs entirely on free, keyless public data.

- **Business Leads**: search local businesses by type and city (OpenStreetMap). Get
  name, address, phone, email and website, then click **Contacts** on any row to
  pull emails, phones and social links straight from that business's own website.
  Export results to CSV.
- **Company Contacts**: paste any company website to scan it for contact details.
  Optional **Email Finder** (first name + last name + domain) via Hunter.io.

## Data sources

| Source | Key needed | Used for |
| --- | --- | --- |
| [Nominatim](https://nominatim.org) + [Overpass](https://overpass-api.de) (OpenStreetMap) | none | business search |
| The business's own website (home, /contact, /about) | none | emails, phones, socials |
| [Hunter.io](https://hunter.io) | `HUNTER_API_KEY` (optional, free plan = 50 credits/mo) | named employees + email finder |

The public Overpass servers are often overloaded, so searches query Nominatim and
Overpass in parallel and merge the results; if Overpass is slow the search still
returns Nominatim's results (flagged as possibly incomplete).

OpenStreetMap coverage is uneven: chains and established businesses are usually
there, while many tiny businesses aren't.

## Public API

No auth, CORS enabled. Every endpoint accepts GET (query string) or POST (JSON body).
`GET /api` returns this list as JSON.

```
GET /api/business-search?category=dentist&location=Sugar%20Land,%20TX[&name=...]
GET /api/site-contacts?website=flossdentalsugarland.com
GET /api/email-finder?firstName=Dana&lastName=Whitfield&domain=acme.com   (needs HUNTER_API_KEY)
GET /api/status
```

Nominatim's usage policy allows about 1 request/second, so heavy automated use
of `/api/business-search` should be throttled on your side.

## Optional: Hunter.io

1. Sign up free at hunter.io and copy your API key.
2. Vercel → Project → Settings → Environment Variables → add `HUNTER_API_KEY`.
3. Redeploy. The top bar shows "hunter.io" in green once it's picked up.

## Deploying

Pushes to `main` deploy automatically on Vercel. No env vars are required.
