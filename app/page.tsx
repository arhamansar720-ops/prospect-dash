'use client';

import { useEffect, useState } from 'react';
import BusinessSearchPanel from '@/components/BusinessSearchPanel';
import PeopleSearchPanel from '@/components/PeopleSearchPanel';

type Status = { osm: boolean; hunter: boolean } | null;

export default function Page() {
  const [tab, setTab] = useState<'business' | 'people'>('business');
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ osm: true, hunter: false }));
  }, []);

  return (
    <div className="shell">
      <div className="topbar">
        <div className="logo-box">PD</div>
        <span className="brand">Prospect Dash</span>
        <span className="brand-sub">v0.3</span>
        <div className="topbar-right">
          <span className="status-pill">
            <span className="dot" />
            openstreetmap
          </span>
          <span className="status-pill">
            <span className={`dot ${status === null ? 'pending' : status.hunter ? '' : 'offline'}`} />
            {status?.hunter ? 'hunter.io' : 'hunter.io (no key)'}
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
            Company Contacts
          </button>
        </div>

        {tab === 'business' ? <BusinessSearchPanel /> : <PeopleSearchPanel hunter={status ? status.hunter : null} />}
      </main>

      <footer className="app-footer">
        <span>prospect-dash · personal use</span>
        <span>data: OpenStreetMap · company websites · Hunter.io (optional)</span>
      </footer>
    </div>
  );
}
