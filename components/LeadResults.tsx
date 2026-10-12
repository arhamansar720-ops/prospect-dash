'use client';

import { useState } from 'react';
import { BusinessLead, RevealedLead, SearchResult } from '@/lib/types';
import { revealLead } from '@/lib/apollo';

type Props = {
  data: SearchResult<BusinessLead> | null;
  loading: boolean;
  searched: boolean;
  emptyHint: string;
  onPage: (page: number) => void;
};

export default function LeadResults({ data, loading, searched, emptyHint, onPage }: Props) {
  const [revealed, setRevealed] = useState<Record<string, RevealedLead>>({});
  const [revealing, setRevealing] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  async function reveal(id: string) {
    setRevealing(id);
    setRevealError(null);
    try {
      const r = await revealLead(id);
      setRevealed((prev) => ({ ...prev, [id]: r }));
    } catch (e) {
      setRevealError(e instanceof Error ? e.message : 'Reveal failed');
    } finally {
      setRevealing(null);
    }
  }

  const results = data?.results ?? [];
  const totalPages = data ? Math.min(500, Math.ceil(data.total / data.perPage)) : 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Results</span>
        <span className="panel-eyebrow">
          {data ? `${data.total.toLocaleString()} match${data.total === 1 ? '' : 'es'}` : ''}
        </span>
      </div>

      {revealError && <div className="error-box inset">{revealError}</div>}
      {loading && <div className="loading-row">Querying Apollo…</div>}

      {!loading && !searched && (
        <div className="empty-state">
          <div className="empty-state-title">No search yet</div>
          <div className="empty-state-sub">{emptyHint}</div>
        </div>
      )}

      {!loading && searched && data && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">No matches</div>
          <div className="empty-state-sub">Try broadening your search terms.</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const full = revealed[r.id];
                  return (
                    <tr key={r.id}>
                      <td>
                        {full?.linkedinUrl ? (
                          <a href={full.linkedinUrl} target="_blank" rel="noreferrer">
                            {full.name || r.name}
                          </a>
                        ) : (
                          full?.name || r.name
                        )}
                      </td>
                      <td>{r.title}</td>
                      <td>{full?.company || r.company}</td>
                      <td>
                        {full ? (
                          full.email ? <a href={`mailto:${full.email}`}>{full.email}</a> : '—'
                        ) : (
                          <span className={`tag ${r.hasEmail ? 'match-high' : ''}`}>
                            {r.hasEmail ? 'available' : 'none'}
                          </span>
                        )}
                      </td>
                      <td>
                        {full ? (
                          full.phone || '—'
                        ) : (
                          <span className={`tag ${r.hasPhone ? 'match-high' : ''}`}>
                            {r.hasPhone ? 'available' : 'none'}
                          </span>
                        )}
                      </td>
                      <td>{full ? full.location || '—' : '—'}</td>
                      <td>
                        {!full && (
                          <button
                            className="btn btn-small"
                            onClick={() => reveal(r.id)}
                            disabled={revealing !== null}
                            title="Look up full name, email and location (uses ~1 Apollo credit)"
                          >
                            {revealing === r.id ? '…' : 'Reveal'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && data && (
            <div className="pager">
              <button className="btn btn-ghost btn-small" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>
                Prev
              </button>
              <span className="hint">
                Page {data.page} of {totalPages.toLocaleString()}
              </span>
              <button
                className="btn btn-ghost btn-small"
                disabled={data.page >= totalPages}
                onClick={() => onPage(data.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
