'use client';

import { useState } from 'react';
import { BusinessLead, PeopleSearchParams, SearchResult } from '@/lib/types';
import { searchPeople } from '@/lib/apollo';
import LeadResults from './LeadResults';

export default function PeopleSearchPanel() {
  const [params, setParams] = useState<PeopleSearchParams>({});
  const [data, setData] = useState<SearchResult<BusinessLead> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const hasInput = Object.values(params).some((v) => v?.trim());

  function update(field: keyof PeopleSearchParams, value: string) {
    setParams((p) => ({ ...p, [field]: value }));
  }

  async function runSearch(page = 1) {
    if (!hasInput) {
      setError('Fill at least one field.');
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      setData(await searchPeople(params, page));
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setParams({});
    setData(null);
    setSearched(false);
    setError(null);
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">People Search</span>
          <span className="panel-eyebrow">source: apollo.io (professional profiles)</span>
        </div>
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(1);
          }}
        >
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
              <label htmlFor="p-keywords">Keywords</label>
              <input
                id="p-keywords"
                placeholder="e.g. roofing, realtor, CPA"
                value={params.keywords || ''}
                onChange={(e) => update('keywords', e.target.value)}
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
            <span className="hint">Phone / home-address lookup isn&apos;t supported by Apollo</span>
          </div>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      <LeadResults
        data={data}
        loading={loading}
        searched={searched}
        emptyHint="Enter a name, keywords, or city above and run a search."
        onPage={runSearch}
      />
    </>
  );
}
