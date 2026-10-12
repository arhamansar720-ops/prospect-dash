'use client';

import { SiteContacts } from '@/lib/types';

export default function ContactsCard({ data }: { data: SiteContacts }) {
  const nothing = !data.emails.length && !data.phones.length && !data.socials.length && !data.people.length;

  return (
    <div className="contacts-card">
      {nothing && (
        <div className="hint">
          No contact details found on {data.domain}
          {data.pagesScanned.length ? '' : ' (the site could not be reached)'}.
        </div>
      )}

      {data.emails.length > 0 && (
        <div className="contacts-group">
          <div className="contacts-label">Emails on site</div>
          {data.emails.map((e) => (
            <a key={e} href={`mailto:${e}`}>
              {e}
            </a>
          ))}
        </div>
      )}

      {data.phones.length > 0 && (
        <div className="contacts-group">
          <div className="contacts-label">Phones on site</div>
          {data.phones.map((p) => (
            <a key={p} href={`tel:${p}`}>
              {p}
            </a>
          ))}
        </div>
      )}

      {data.socials.length > 0 && (
        <div className="contacts-group">
          <div className="contacts-label">Social</div>
          {data.socials.map((s) => (
            <a key={s} href={s} target="_blank" rel="noreferrer">
              {s.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          ))}
        </div>
      )}

      {data.people.length > 0 && (
        <div className="contacts-group wide">
          <div className="contacts-label">People (Hunter.io)</div>
          <table className="results-table compact">
            <tbody>
              {data.people.map((p) => (
                <tr key={p.email}>
                  <td>{p.linkedin ? <a href={p.linkedin} target="_blank" rel="noreferrer">{p.name}</a> : p.name}</td>
                  <td>{p.position || '—'}</td>
                  <td>
                    <a href={`mailto:${p.email}`}>{p.email}</a>
                  </td>
                  <td>{p.confidence != null ? `${p.confidence}%` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="contacts-foot hint">
        Scanned {data.pagesScanned.length} page{data.pagesScanned.length === 1 ? '' : 's'} on {data.domain}
        {data.hunter === 'not-configured' && ' · add HUNTER_API_KEY to also list named employees'}
        {data.hunter === 'error' && ` · Hunter: ${data.hunterError}`}
      </div>
    </div>
  );
}
