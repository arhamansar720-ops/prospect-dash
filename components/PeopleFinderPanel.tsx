'use client';

import { useState } from 'react';
import { PeopleSearchParams, PeopleSearchResult, Provider } from '@/lib/types';
import { searchPeople } from '@/lib/api';

function toCsv(rows: Provider[]) {
  const esc = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Name', 'Credential', 'Specialty', 'Address', 'Phone', 'NPI'];
  return [header.join(','), ...rows.map((r) => [r.name, r.credential, r.specialty, r.address, r.phone, r.npi].map(esc).join(','))].join(
    '\n'
  );
}

export default function PeopleFinderPanel() {
  const [params, setParams] = useState<PeopleSearchParams>({});
  const [data, setData] = useState<PeopleSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof PeopleSearchParams, value: string) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    try {
      setData(await searchPeople(params));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv(rows: Provider[]) {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'providers.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clear() {
    setParams({});
    setData(null);
    setError(null);
  }

  const rows = data?.results ?? [];

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">People Finder</span>
          <span className="panel-eyebrow">source: cms npi registry (us healthcare providers, free)</span>
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
              <input
                id="p-first"
                placeholder="e.g. Angie"
                value={params.firstName || ''}
                onChange={(e) => update('firstName', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-last">Last name</label>
              <input
                id="p-last"
                placeholder="e.g. Nguyen  (or Ngu* for prefix)"
                value={params.lastName || ''}
                onChange={(e) => update('lastName', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-specialty">Specialty</label>
              <input
                id="p-specialty"
                placeholder="e.g. dentist, chiropractor, family medicine"
                value={params.specialty || ''}
                onChange={(e) => update('specialty', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-location">City, state</label>
              <input
                id="p-location"
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
            <span className="hint">Doctors, dentists, nurses, therapists, clinics — practice address &amp; phone</span>
          </div>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Results</span>
          <span className="panel-eyebrow">
            {data ? `${rows.length}${rows.length >= 200 ? '+' : ''} provider${rows.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>

        {loading && <div className="loading-row">Querying NPI Registry…</div>}

        {!loading && !data && (
          <div className="empty-state">
            <div className="empty-state-title">No search yet</div>
            <div className="empty-state-sub">
              Search any US healthcare provider by name, specialty and city. Add a city to narrow common names.
            </div>
          </div>
        )}

        {!loading && data && rows.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">No matches</div>
            <div className="empty-state-sub">Check spelling, or add * to the last name for a prefix match.</div>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <div className="results-toolbar">
              <span className="hint">{rows.length >= 200 ? 'Showing first 200 — narrow your search' : ''}</span>
              <button className="btn btn-ghost btn-small" onClick={() => exportCsv(rows)}>
                Export CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Specialty</th>
                    <th>Practice address</th>
                    <th>Phone</th>
                    <th>NPI</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.npi}>
                      <td>
                        {r.name}
                        {r.credential && <span className="hint"> {r.credential}</span>}
                        {r.kind === 'organization' && <span className="tag">org</span>}
                      </td>
                      <td>{r.specialty || '—'}</td>
                      <td>{r.address || '—'}</td>
                      <td className="nowrap">{r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : '—'}</td>
                      <td>
                        <a href={r.profileUrl} target="_blank" rel="noreferrer">
                          {r.npi}
                        </a>
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
