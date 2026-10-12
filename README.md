# Prospect Dash

Personal prospecting dashboard that runs entirely on free, keyless public data.

There is no free general-purpose people-search API (name/phone/home-address data
is sold by data brokers under permissible-use agreements), so the People Finder
combines free public directories of people in professional/public roles.

- **Business Leads**: search local businesses by type and city (OpenStreetMap). Get
  name, address, phone, email and website, then click **Contacts** on any row to
  pull emails, phones and social links straight from that business's own website.
  Export results to CSV.
- **People Finder**: one search across six free public directories of people in
  professional or public roles, merged into one table (filter by source, export CSV):
  NPI Registry (healthcare providers, with practice address/phone), FINRA BrokerCheck
  (brokers & advisers, with firm/branch), GitHub (developers), ORCID (researchers),
  Wikidata (notable people), Gravatar (public profile for an email). It deliberately
  doesn't pull home addresses, personal phones or relatives from people-search sites.
- **Company Contacts**: paste any company website to scan it for contact details.
  Optional **Email Finder** (first name + last name + domain) via Hunter.io.

## Data sources

| Source | Key needed | Used for |
| --- | --- | --- |
| [Nominatim](https://nominatim.org) + [Overpass](https://overpass-api.de) (OpenStreetMap) | none | business search |
| [NPI Registry](https://npiregistry.cms.hhs.gov/api-page) (CMS) | none | people finder (healthcare providers) |
| [FINRA BrokerCheck](https://brokercheck.finra.org) | none | people finder (brokers/advisers) |
| [GitHub](https://docs.github.com/rest/search) | optional `GITHUB_TOKEN` (raises 60/hr limit) | people finder (developers) |
| [ORCID](https://info.orcid.org/documentation/api-tutorials/) | none | people finder (researchers) |
| [Wikidata](https://www.wikidata.org/w/api.php) | none | people finder (notable people) |
| [Gravatar](https://docs.gravatar.com/api/profiles/rest-api/) | none | people finder (email → public profile) |
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
GET /api/people-search?firstName=john&lastName=smith&location=Houston,%20TX[&specialty=][&email=]
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
