'use client';

import { useState } from 'react';
import BusinessSearchPanel from '@/components/BusinessSearchPanel';
import PeopleSearchPanel from '@/components/PeopleSearchPanel';

export default function Page() {
  const [tab, setTab] = useState<'business' | 'people'>('business');

  return (
    <div className="shell">
      <div className="topbar">
        <div className="logo-box">PD</div>
        <span className="brand">Prospect Dash</span>
        <span className="brand-sub">v0.1 — local build</span>
        <div className="topbar-right">
          <span className="status-pill">
            <span className="dot offline" />
            no data source connected
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
        <span>mock data — wire lib/apollo.ts and lib/peoplesearch.ts to go live</span>
      </footer>
    </div>
  );
}
