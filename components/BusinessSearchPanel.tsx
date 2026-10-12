'use client';

import { Fragment, useState } from 'react';
import { Business, BusinessSearchParams, BusinessSearchResult, SiteContacts } from '@/lib/types';
import { getSiteContacts, searchBusinesses } from '@/lib/api';
import ContactsCard from './ContactsCard';

function toCsv(rows: Business[], contacts: Record<string, SiteContacts>) {
  const esc = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Name', 'Category', 'Address', 'Phone', 'Email', 'Website', 'Site emails', 'Site phones'];
  const lines = rows.map((b) => {
    const c = contacts[b.id];
    return [b.name, b.category, b.address, b.phone, b.email, b.website, c?.emails.join('; '), c?.phones.join('; ')]
      .map(esc)
      .join(',');
  });
  return [header.join(','), ...lines].join('\n');
}

export default function BusinessSearchPanel() {
  const [params, setParams] = useState<BusinessSearchParams>({});
  const [data, setData] = useState<BusinessSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyWithWebsite, setOnlyWithWebsite] = useState(false);
  const [contacts, setContacts] = useState<Record<string, SiteContacts>>({});
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [loadingContacts, setLoadingContacts] = useState<Set<string>>(new Set());

  function update(field: keyof BusinessSearchParams, value: string) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    setContacts({});
    setContactErrors({});
    try {
      setData(await searchBusinesses(params));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function findContacts(b: Business) {
    if (!b.website) return;
    setLoadingContacts((s) => new Set(s).add(b.id));
    setContactErrors(({ [b.id]: _, ...rest }) => rest);
    try {
      const c = await getSiteContacts(b.website);
      setContacts((prev) => ({ ...prev, [b.id]: c }));
    } catch (e) {
      setContactErrors((prev) => ({ ...prev, [b.id]: e instanceof Error ? e.message : 'Lookup failed' }));
    } finally {
      setLoadingContacts((s) => {
        const next = new Set(s);
        next.delete(b.id);
        return next;
      });
    }
  }

  function exportCsv(rows: Business[]) {
    const blob = new Blob([toCsv(rows, contacts)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${(params.category || params.name || 'search').replace(/\W+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clear() {
    setParams({});
    setData(null);
    setError(null);
    setContacts({});
  }

  const rows = (data?.results ?? []).filter((b) => !onlyWithWebsite || b.website);

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Business Lead Search</span>
          <span className="panel-eyebrow">source: openstreetmap (free, no key)</span>
        </div>
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
        >
          <div className="field-grid">
            <div className="field">
              <label htmlFor="b-category">Business type</label>
              <input
                id="b-category"
                placeholder="e.g. roofer, dentist, lawyer, restaurant"
                value={params.category || ''}
                onChange={(e) => update('category', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="b-name">Business name (optional)</label>
              <input
                id="b-name"
                placeholder="e.g. Harbor"
                value={params.name || ''}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="b-location">Location</label>
              <input
                id="b-location"
                placeholder="e.g. Houston, TX"
                value={params.location || ''}
                onChange={(e) => update('location', e.target.value)}
              />
            </div>
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
            <span className="hint">Big cities can take 10–20s</span>
          </div>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Results</span>
          <span className="panel-eyebrow">
            {data
              ? `${rows.length}${data.truncated ? '+' : ''} business${rows.length === 1 ? '' : 'es'} · ${data.location}`
              : ''}
          </span>
        </div>

        {loading && <div className="loading-row">Querying OpenStreetMap…</div>}

        {!loading && !data && (
          <div className="empty-state">
            <div className="empty-state-title">No search yet</div>
            <div className="empty-state-sub">
              Enter a business type and a city, then hit Search. Click &ldquo;Contacts&rdquo; on any result to pull
              emails and phones from its website.
            </div>
          </div>
        )}

        {!loading && data && data.results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">No matches</div>
            <div className="empty-state-sub">Try a broader type (e.g. &ldquo;restaurant&rdquo;) or a bigger area.</div>
          </div>
        )}

        {!loading && data && data.results.length > 0 && (
          <>
            <div className="results-toolbar">
              {data.partial && <span className="hint">Some sources were busy — results may be incomplete</span>}
              <label className="check">
                <input type="checkbox" checked={onlyWithWebsite} onChange={(e) => setOnlyWithWebsite(e.target.checked)} />
                Only with website
              </label>
              <button className="btn btn-ghost btn-small" onClick={() => exportCsv(rows)}>
                Export CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Website</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <Fragment key={b.id}>
                      <tr>
                        <td>
                          <a href={b.osmUrl} target="_blank" rel="noreferrer">
                            {b.name}
                          </a>
                        </td>
                        <td>{b.category || '—'}</td>
                        <td>{b.address || '—'}</td>
                        <td className="nowrap">{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : '—'}</td>
                        <td>{b.email ? <a href={`mailto:${b.email}`}>{b.email}</a> : '—'}</td>
                        <td>
                          {b.website ? (
                            <a href={b.website} target="_blank" rel="noreferrer">
                              {b.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {b.website && !contacts[b.id] && (
                            <button
                              className="btn btn-small"
                              onClick={() => findContacts(b)}
                              disabled={loadingContacts.has(b.id)}
                            >
                              {loadingContacts.has(b.id) ? '…' : 'Contacts'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {(contacts[b.id] || contactErrors[b.id]) && (
                        <tr className="detail-row">
                          <td colSpan={7}>
                            {contacts[b.id] ? (
                              <ContactsCard data={contacts[b.id]} />
                            ) : (
                              <div className="error-box flush">{contactErrors[b.id]}</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <div className="attribution">
        Business data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
      </div>
    </>
  );
}
