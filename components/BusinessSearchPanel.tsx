'use client';

import { useState } from 'react';
import { BusinessLead, BusinessSearchParams } from '@/lib/types';
import { searchBusinessLeads } from '@/lib/apollo';

export default function BusinessSearchPanel() {
  const [params, setParams] = useState<BusinessSearchParams>({});
  const [results, setResults] = useState<BusinessLead[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  function update(field: keyof BusinessSearchParams, value: string) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchBusinessLeads(params);
      setResults(res);
    } catch (e) {
      setError('Search failed. Check that your data source is connected in lib/apollo.ts.');
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setParams({});
    setResults(null);
    setSearched(false);
    setError(null);
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Business Lead Search</span>
          <span className="panel-eyebrow">source: apollo.io (not yet connected)</span>
        </div>
        <div className="panel-body">
          <div className="field-grid">
            <div className="field">
              <label htmlFor="b-name">Contact name</label>
              <input
                id="b-name"
                placeholder="e.g. Dana Whitfield"
                value={params.name || ''}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="b-company">Company</label>
              <input
                id="b-company"
                placeholder="e.g. Harbor Logistics"
                value={params.company || ''}
                onChange={(e) => update('company', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="b-title">Job title</label>
              <input
                id="b-title"
                placeholder="e.g. Director of Procurement"
                value={params.title || ''}
                onChange={(e) => update('title', e.target.value)}
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
            <button className="btn btn-primary" onClick={runSearch} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
            <span className="hint">Fill at least one field</span>
          </div>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Results</span>
          <span className="panel-eyebrow">
            {results ? `${results.length} match${results.length === 1 ? '' : 'es'}` : ''}
          </span>
        </div>
        {loading && <div className="loading-row">Querying business records…</div>}
        {!loading && !searched && (
          <div className="empty-state">
            <div className="empty-state-title">No search yet</div>
            <div className="empty-state-sub">
              Enter a name, company, title, or location above and run a search.
            </div>
          </div>
        )}
        {!loading && searched && results && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">No matches</div>
            <div className="empty-state-sub">Try broadening your search terms.</div>
          </div>
        )}
        {!loading && results && results.length > 0 && (
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.title}</td>
                  <td>{r.company}</td>
                  <td>{r.email || '—'}</td>
                  <td>{r.phone || '—'}</td>
                  <td>{r.location}</td>
                  <td>
                    <span className={`tag match-${r.matchConfidence === 'medium' ? 'mid' : r.matchConfidence}`}>
                      {r.matchConfidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
