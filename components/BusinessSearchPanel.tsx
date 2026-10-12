'use client';

import { useState } from 'react';
import { BusinessLead, BusinessSearchParams, SearchResult } from '@/lib/types';
import { searchBusinessLeads } from '@/lib/apollo';
import LeadResults from './LeadResults';

export default function BusinessSearchPanel() {
  const [params, setParams] = useState<BusinessSearchParams>({});
  const [data, setData] = useState<SearchResult<BusinessLead> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const hasInput = Object.values(params).some((v) => v?.trim());

  function update(field: keyof BusinessSearchParams, value: string) {
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
      setData(await searchBusinessLeads(params, page));
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
          <span className="panel-title">Business Lead Search</span>
          <span className="panel-eyebrow">source: apollo.io</span>
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
              <label htmlFor="b-name">Contact name</label>
              <input
                id="b-name"
                placeholder="e.g. Dana Whitfield"
                value={params.name || ''}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="b-company">Company or domain</label>
              <input
                id="b-company"
                placeholder="e.g. harborlogistics.com"
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
            <span className="hint">Searching is free · Reveal uses ~1 Apollo credit</span>
          </div>
        </form>
      </div>

      {error && <div className="error-box">{error}</div>}

      <LeadResults
        data={data}
        loading={loading}
        searched={searched}
        emptyHint="Enter a name, company, title, or location above and run a search."
        onPage={runSearch}
      />
    </>
  );
}
