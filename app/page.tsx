'use client';

import { useEffect, useState } from 'react';
import BusinessSearchPanel from '@/components/BusinessSearchPanel';
import PeopleSearchPanel from '@/components/PeopleSearchPanel';

type Status = { connected: boolean; reason?: string | null } | null;

export default function Page() {
  const [tab, setTab] = useState<'business' | 'people'>('business');
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, reason: 'status check failed' }));
  }, []);

  return (
    <div className="shell">
      <div className="topbar">
        <div className="logo-box">PD</div>
        <span className="brand">Prospect Dash</span>
        <span className="brand-sub">v0.2</span>
        <div className="topbar-right">
          <span className="status-pill">
            <span className={`dot ${status === null ? 'pending' : status.connected ? '' : 'offline'}`} />
            {status === null
              ? 'checking apollo…'
              : status.connected
                ? 'apollo connected'
                : status.reason || 'apollo not connected'}
          </span>
        </div>
      </div>

      <main>
        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'business' ? 'active' : ''}`}
            onClick={() => setTab('business')}
          >
            Business Leads
          </button>
          <button
            className={`tab-btn ${tab === 'people' ? 'active' : ''}`}
            onClick={() => setTab('people')}
          >
            People Search
          </button>
        </div>

        {tab === 'business' ? <BusinessSearchPanel /> : <PeopleSearchPanel />}
      </main>

      <footer className="app-footer">
        <span>prospect-dash · personal use</span>
        <span>live data via Apollo People API Search</span>
      </footer>
    </div>
  );
}
