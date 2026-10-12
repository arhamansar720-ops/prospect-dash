import { fetchWithTimeout } from './http';

const CONTACT_PATHS = ['', '/contact', '/contact-us', '/about', '/about-us'];
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const TEL_RE = /href=["']tel:([^"']+)["']/gi;
const SOCIAL_RE = /href=["'](https?:\/\/(?:www\.)?(?:linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com)\/[^"'?#\s]+)/gi;
const JUNK_EMAIL = /\.(png|jpe?g|gif|svg|webp|css|js)$|@(sentry|example|domain|email)\.|wixpress|godaddy/i;

/**
 * Reads a business's own public pages (home, contact, about) and pulls out
 * emails, tel: links and social profiles. No API key, no third party.
 */
export async function scrapeSite(domain: string) {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const socials = new Set<string>();
  const pagesScanned: string[] = [];

  const pages = await Promise.all(
    CONTACT_PATHS.map(async (path) => {
      const url = `https://${domain}${path}`;
      try {
        const res = await fetchWithTimeout(url, { redirect: 'follow' }, 7000);
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || !type.includes('text/html')) return null;
        // Don't follow redirects off to another site.
        const finalHost = new URL(res.url).hostname.replace(/^www\./, '');
        if (finalHost !== domain && !finalHost.endsWith(`.${domain}`)) return null;
        const html = (await res.text()).slice(0, 1_500_000);
        return { url, html };
      } catch {
        return null;
      }
    })
  );

  for (const page of pages) {
    if (!page) continue;
    pagesScanned.push(page.url);
    const html = page.html.replace(/&#64;|&#x40;|\[at\]|\(at\)/gi, '@');
    for (const m of html.match(EMAIL_RE) ?? []) {
      const e = m.toLowerCase().replace(/^mailto:/, '');
      if (!JUNK_EMAIL.test(e)) emails.add(e);
    }
    for (const m of Array.from(html.matchAll(TEL_RE))) {
      const p = decodeURIComponent(m[1]).trim();
      if (p.replace(/\D/g, '').length >= 7) phones.add(p);
    }
    for (const m of Array.from(html.matchAll(SOCIAL_RE))) socials.add(m[1].replace(/\/$/, ''));
  }

  // Emails on the business's own domain first.
  const sorted = Array.from(emails).sort(
    (a, b) => Number(b.endsWith(`@${domain}`)) - Number(a.endsWith(`@${domain}`))
  );

  return {
    emails: sorted.slice(0, 20),
    phones: Array.from(phones).slice(0, 10),
    socials: Array.from(socials).slice(0, 10),
    pagesScanned,
  };
}
