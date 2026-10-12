# Prospect Dash

Personal prospecting dashboard — two modes in one UI:

- **Business Leads** — name / company / title / location search (built for Apollo.io)
- **People Search** — name / phone / address search (bring your own provider)

Both tabs run on live Apollo.io data through server-side API routes
(the key never reaches the browser).

## How the data works

| Route | Apollo endpoint | Cost |
| --- | --- | --- |
| `POST /api/business-search` | `mixed_people/api_search` | 0 credits |
| `POST /api/people-search` | `mixed_people/api_search` | 0 credits |
| `POST /api/enrich` (the **Reveal** button) | `people/match` | ~1 credit when an email is found |
| `GET /api/status` | `auth/health` | 0 credits |

Search results come back with obfuscated last names and only *whether* an
email/phone exists. Clicking **Reveal** on a row enriches that one person.

The old `mixed_people/search` endpoint is paid-plan only — on a free Apollo
account it returns `403 API_INACCESSIBLE`, which is why v0.1 never worked.
Free-plan access to `api_search` also requires an Apollo account registered
with a work email.

Apollo can't search by phone number or home address; that would need a
separate people-data provider (Endato, IDI, Whitepages Pro, …) with its own
permissible-use terms.

Set `APOLLO_API_KEY` under Vercel → Project → Settings → Environment Variables.

## Deploying (GitHub → Vercel, browser only)

1. Create a new repo on GitHub, upload this whole folder via the web UI
   (drag-and-drop is fine — no CLI needed).
2. In Vercel, "Add New Project" → import that repo. Vercel auto-detects Next.js,
   no config needed.
3. Add `APOLLO_API_KEY` under Vercel → Project → Settings → Environment Variables.

## Local persistence

None yet, by design — this build is UI + live API calls only. If you want to save
searches later, the simplest no-Supabase option is browser `localStorage` (just
recent searches, client-side only, no server needed).
