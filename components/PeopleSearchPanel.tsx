'use client';

import { useState } from 'react';
import { PersonRecord, PeopleSearchParams } from '@/lib/types';
import { searchPeople } from '@/lib/peoplesearch';

export default function PeopleSearchPanel() {
  const [params, setParams] = useState<PeopleSearchParams>({});
  const [results, setResults] = useState<PersonRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  function update(field: keyof PeopleSearchParams, value: string) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  async function runSearch() {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await searchPeople(params);
      setResults(res);
    } catch (e) {
      setError('Search failed. Check that your data source is connected in lib/peoplesearch.ts.');
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
          <span className="panel-title">People Search</span>
          <span className="panel-eyebrow">source: not yet connected</span>
        </div>
        <div className="panel-body">
          <div className="field-grid">
            <div className="field">
              <label htmlFor="p-name">Full name</label>
              <input
                id="p-name"
                placeholder="e.g. Jordan Caldwell"
                value={params.name || ''}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-phone">Phone</label>
              <input
                id="p-phone"
                placeholder="e.g. (832) 555-0118"
                value={params.phone || ''}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-address">Address</label>
              <input
                id="p-address"
                placeholder="e.g. 4821 Birchcrest Ln"
                value={params.address || ''}
                onChange={(e) => update('address', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="p-city">City / state</label>
              <input
                id="p-city"
                placeholder="e.g. Sugar Land, TX"
                value={params.city || ''}
                onChange={(e) => update('city', e.target.value)}
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
        {loading && <div className="loading-row">Querying public records…</div>}
        {!loading && !searched && (
          <div className="empty-state">
            <div className="empty-state-title">No search yet</div>
            <div className="empty-state-sub">
              Enter a name, phone, or address above and run a search.
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
                <th>Age</th>
                <th>Phones</th>
                <th>Addresses</th>
                <th>Related to</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.age ?? '—'}</td>
                  <td>{r.phones.length ? r.phones.join(', ') : '—'}</td>
                  <td>{r.addresses.length ? r.addresses.join(' / ') : '—'}</td>
                  <td>{r.relatedTo.length ? r.relatedTo.join(', ') : '—'}</td>
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
