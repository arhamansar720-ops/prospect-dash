# Prospect Dash

Personal prospecting dashboard — two modes in one UI:

- **Business Leads** — name / company / title / location search (built for Apollo.io)
- **People Search** — name / phone / address search (bring your own provider)

Currently runs on mock data so you can see the UI/UX before wiring anything live.

## Design

Token system: navy `#16273D` + Roblox-blue `#2E6FBA` primary, single signal-orange
`#FF7A29` for the one action that matters (Search), hard 2px borders instead of
shadows, `Barlow Condensed` for headers/nav, `Inter` for body, `JetBrains Mono`
for all data (phone numbers, addresses, results tables) so things line up.

## Wiring up real data

### Business Leads → Apollo.io
1. Create `app/api/business-search/route.ts` — a server route that calls Apollo's
   People Search endpoint using an `APOLLO_API_KEY` environment variable (never
   call Apollo from the browser directly — your key would be exposed).
2. In `lib/apollo.ts`, swap the mock return for a `fetch('/api/business-search', ...)`
   call to your new route. The wire-up comment at the top of that file has the
   exact request shape.

### People Search → a data-broker provider
1. Pick a provider (Endato, IDI Data, Whitepages Pro, etc.) and read their terms —
   most require a business account and have permissible-use restrictions if results
   could ever be used for credit, employment, or tenant screening decisions.
2. Same pattern: add `app/api/people-search/route.ts` as a server-side proxy holding
   the provider key in an env var, then swap the mock in `lib/peoplesearch.ts`.

## Deploying (GitHub → Vercel, browser only)

1. Create a new repo on GitHub, upload this whole folder via the web UI
   (drag-and-drop is fine — no CLI needed).
2. In Vercel, "Add New Project" → import that repo. Vercel auto-detects Next.js,
   no config needed.
3. Once you add the API routes above, add `APOLLO_API_KEY` (and your people-search
   key) under Vercel → Project → Settings → Environment Variables before deploying
   live data.

## Local persistence

None yet, by design — this build is UI + live API calls only. If you want to save
searches later, the simplest no-Supabase option is browser `localStorage` (just
recent searches, client-side only, no server needed).
