'use client';

import { useState } from 'react';
import { PeopleSearchParams, PeopleSearchResult, PersonHit, PersonSourceId } from '@/lib/types';
import { searchPeople } from '@/lib/api';

function toCsv(rows: PersonHit[]) {
  const esc = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Source', 'Name', 'Headline', 'Organization', 'Location', 'Phone', 'Email', 'Profile'];
  return [
    header.join(','),
    ...rows.map((r) =>
      [r.source, r.name, r.headline, r.organization, r.location, r.phone, r.email, r.url].map(esc).join(',')
    ),
  ].join('\n');
}

export default function PeopleFinderPanel() {
  const [params, setParams] = useState<PeopleSearchParams>({});
  const [data, setData] = useState<PeopleSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<PersonSourceId>>(new Set());

  function update(field: keyof PeopleSearchParams, value: string) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    setHidden(new Set());
    try {
      setData(await searchPeople(params));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: PersonSourceId) {
    setHidden((h) => {
      const next = new Set(h);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCsv(rows: PersonHit[]) {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'people.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clear() {
    setParams({});
    setData(null);
    setError(null);
  }

  const labels = Object.fromEntries((data?.sources ?? []).map((s) => [s.id, s.label]));
  const rows = (data?.results ?? []).filter((r) => !hidden.has(r.source));

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">People Finder</span>
          <span className="panel-eyebrow">6 public directories · free, no keys</span>
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
              <label htmlFor="p-first">First name</label>
              <input id="p-first" placeholder="e.g. John" value={params.firstName || ''} onChange={(e) => update('firstName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-last">Last name</label>
              <input id="p-last" placeholder="e.g. Smith" value={params.lastName || ''} onChange={(e) => update('lastName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-location">City, state</label>
              <input id="p-location" placeholder="e.g. Houston, TX" value={params.location || ''} onChange={(e) => update('location', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-specialty">Healthcare specialty (optional)</label>
              <input
                id="p-specialty"
                placeholder="e.g. dentist, chiropractor"
                value={params.specialty || ''}
                onChange={(e) => update('specialty', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-email">Email (optional)</label>
              <input id="p-email" placeholder="e.g. dana@acme.com" value={params.email || ''} onChange={(e) => update('email', e.target.value)} />
            </div>
          </div>
          <div className="actions-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
            <span className="hint">NPI · FINRA · GitHub · ORCID · Wikidata · Gravatar</span>
          </div>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Results</span>
          <span className="panel-eyebrow">{data ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : ''}</span>
        </div>

        {loading && <div className="loading-row">Querying 6 public directories…</div>}

        {!loading && data && (
          <div className="source-chips">
            {data.sources.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`source-chip ${s.status} ${hidden.has(s.id) ? 'off' : ''}`}
                onClick={() => s.count > 0 && toggle(s.id)}
                title={`${s.covers}${s.note ? ` — ${s.note}` : ''}`}
              >
                {s.label} <b>{s.status === 'ok' ? s.count : s.status === 'skipped' ? '–' : '!'}</b>
              </button>
            ))}
          </div>
        )}

        {!loading && !data && (
          <div className="empty-state">
            <div className="empty-state-title">No search yet</div>
            <div className="empty-state-sub">
              Searches healthcare providers, financial advisors, developers, researchers and notable people at once.
              Add an email to also check for a public Gravatar profile.
            </div>
          </div>
        )}

        {!loading && data && data.results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">No matches</div>
            <div className="empty-state-sub">
              These directories only cover people in professional or public roles. Try without a city, or check spelling.
            </div>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <div className="results-toolbar">
              <span className="hint">Click a source above to hide/show it</span>
              <button className="btn btn-ghost btn-small" onClick={() => exportCsv(rows)}>
                Export CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Organization</th>
                    <th>Location</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={`tag src-${r.source}`}>{labels[r.source] ?? r.source}</span>
                      </td>
                      <td>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.name}
                        </a>
                        {r.links.map((l) => (
                          <a key={l.url} className="sublink" href={l.url} target="_blank" rel="noreferrer">
                            {l.label}
                          </a>
                        ))}
                      </td>
                      <td className="clip">{r.headline || '—'}</td>
                      <td>{r.organization || '—'}</td>
                      <td>{r.location || '—'}</td>
                      <td className="nowrap">
                        {r.phone && <a href={`tel:${r.phone}`}>{r.phone}</a>}
                        {r.phone && r.email && <br />}
                        {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                        {!r.phone && !r.email && '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
