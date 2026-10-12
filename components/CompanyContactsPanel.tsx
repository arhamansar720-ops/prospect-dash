'use client';

import { useState } from 'react';
import { EmailFinderParams, EmailFinderResult, SiteContacts } from '@/lib/types';
import { findEmail, getSiteContacts } from '@/lib/api';
import ContactsCard from './ContactsCard';

export default function CompanyContactsPanel({ hunter }: { hunter: boolean | null }) {
  const [website, setWebsite] = useState('');
  const [site, setSite] = useState<SiteContacts | null>(null);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState<string | null>(null);

  const [finder, setFinder] = useState<EmailFinderParams>({});
  const [found, setFound] = useState<EmailFinderResult | null>(null);
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderError, setFinderError] = useState<string | null>(null);

  async function lookupSite() {
    setSiteLoading(true);
    setSiteError(null);
    setSite(null);
    try {
      setSite(await getSiteContacts(website));
    } catch (e) {
      setSiteError(e instanceof Error ? e.message : 'Lookup failed.');
    } finally {
      setSiteLoading(false);
    }
  }

  async function runFinder() {
    setFinderLoading(true);
    setFinderError(null);
    setFound(null);
    try {
      setFound(await findEmail(finder));
    } catch (e) {
      setFinderError(e instanceof Error ? e.message : 'Lookup failed.');
    } finally {
      setFinderLoading(false);
    }
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Company Contacts</span>
          <span className="panel-eyebrow">source: company website{hunter ? ' + hunter.io' : ''}</span>
        </div>
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault();
            lookupSite();
          }}
        >
          <div className="field-grid">
            <div className="field">
              <label htmlFor="c-site">Company website</label>
              <input
                id="c-site"
                placeholder="e.g. harborlogistics.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary" disabled={siteLoading || !website.trim()}>
              {siteLoading ? 'Scanning…' : 'Find contacts'}
            </button>
            <span className="hint">Reads the site&apos;s home, contact and about pages</span>
          </div>
        </form>
        {siteError && <div className="error-box inset">{siteError}</div>}
        {site && (
          <div className="panel-body">
            <ContactsCard data={site} />
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Email Finder</span>
          <span className="panel-eyebrow">
            source: hunter.io {hunter === false ? '(not connected — add HUNTER_API_KEY)' : ''}
          </span>
        </div>
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault();
            runFinder();
          }}
        >
          <div className="field-grid">
            <div className="field">
              <label htmlFor="f-first">First name</label>
              <input
                id="f-first"
                placeholder="e.g. Dana"
                value={finder.firstName || ''}
                onChange={(e) => setFinder((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="f-last">Last name</label>
              <input
                id="f-last"
                placeholder="e.g. Whitfield"
                value={finder.lastName || ''}
                onChange={(e) => setFinder((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="f-domain">Company domain</label>
              <input
                id="f-domain"
                placeholder="e.g. harborlogistics.com"
                value={finder.domain || ''}
                onChange={(e) => setFinder((f) => ({ ...f, domain: e.target.value }))}
              />
            </div>
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary" disabled={finderLoading || hunter === false}>
              {finderLoading ? 'Searching…' : 'Find email'}
            </button>
            <span className="hint">1 Hunter credit per found email · free plan = 50/month</span>
          </div>
        </form>
        {finderError && <div className="error-box inset">{finderError}</div>}
        {found && (
          <div className="panel-body">
            {found.email ? (
              <div className="found-email">
                <a href={`mailto:${found.email}`}>{found.email}</a>
                <span className="tag match-high">{found.score ?? '?'}% confidence</span>
                {found.position && <span className="hint">{found.position}</span>}
              </div>
            ) : (
              <div className="hint">No email found for that person.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
