import React, { useState } from 'react';
import { Link2, ExternalLink, AlertTriangle, CheckCircle2, XCircle, Search } from 'lucide-react';

export default function LinksTab({ data }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!data) return null;

  const { checks = {} } = data;
  const links = checks.links || {};
  const summary = links.summary || {};
  const internal = links.internal?.sample || [];
  const external = links.external?.sample || [];
  const broken = links.broken || [];
  const redirected = links.redirected || [];
  const emptyOrDead = links.emptyOrDead?.sample || [];

  let displayedList = [];
  if (filter === 'all') displayedList = [...broken, ...redirected, ...internal, ...external];
  else if (filter === 'broken') displayedList = broken;
  else if (filter === 'redirected') displayedList = redirected;
  else if (filter === 'internal') displayedList = internal;
  else if (filter === 'external') displayedList = external;
  else if (filter === 'dead') displayedList = emptyOrDead;

  if (searchTerm) {
    displayedList = displayedList.filter(
      l => (l.url || l.href || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (l.text || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Stats Bar */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-label">Total Links Found</div>
          <div className="stat-box-value">{summary.total || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Internal Links</div>
          <div className="stat-box-value">{summary.internalCount || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">External Links</div>
          <div className="stat-box-value">{summary.externalCount || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Broken Links</div>
          <div className="stat-box-value" style={{ color: broken.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {broken.length}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Redirected Links</div>
          <div className="stat-box-value" style={{ color: redirected.length > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
            {redirected.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn-secondary ${filter === 'all' ? 'active' : ''}`}
              style={{ background: filter === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filter === 'all' ? '#fff' : 'var(--text-primary)' }}
              onClick={() => setFilter('all')}
            >
              All ({summary.total || 0})
            </button>
            <button
              className={`btn-secondary ${filter === 'broken' ? 'active' : ''}`}
              style={{ background: filter === 'broken' ? 'var(--danger)' : 'var(--bg-tertiary)', color: filter === 'broken' ? '#fff' : 'var(--text-primary)' }}
              onClick={() => setFilter('broken')}
            >
              Broken ({broken.length})
            </button>
            <button
              className={`btn-secondary ${filter === 'redirected' ? 'active' : ''}`}
              style={{ background: filter === 'redirected' ? 'var(--warning)' : 'var(--bg-tertiary)', color: filter === 'redirected' ? '#000' : 'var(--text-primary)' }}
              onClick={() => setFilter('redirected')}
            >
              Redirected ({redirected.length})
            </button>
            <button
              className={`btn-secondary ${filter === 'internal' ? 'active' : ''}`}
              style={{ background: filter === 'internal' ? 'var(--accent-cyan)' : 'var(--bg-tertiary)', color: filter === 'internal' ? '#fff' : 'var(--text-primary)' }}
              onClick={() => setFilter('internal')}
            >
              Internal ({summary.internalCount || 0})
            </button>
            <button
              className={`btn-secondary ${filter === 'external' ? 'active' : ''}`}
              style={{ background: filter === 'external' ? 'var(--accent-indigo)' : 'var(--bg-tertiary)', color: filter === 'external' ? '#fff' : 'var(--text-primary)' }}
              onClick={() => setFilter('external')}
            >
              External ({summary.externalCount || 0})
            </button>
            <button
              className={`btn-secondary ${filter === 'dead' ? 'active' : ''}`}
              style={{ background: filter === 'dead' ? 'var(--text-muted)' : 'var(--bg-tertiary)', color: filter === 'dead' ? '#fff' : 'var(--text-primary)' }}
              onClick={() => setFilter('dead')}
            >
              Dead/Empty ({summary.emptyOrDeadCount || 0})
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search links or anchor text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Links Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Anchor Text</th>
                <th>Destination URL</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.length > 0 ? (
                displayedList.slice(0, 100).map((l, i) => {
                  const isBroken = l.statusCode >= 400 || l.error;
                  const isRedirect = l.statusCode >= 300 && l.statusCode < 400;

                  return (
                    <tr key={i}>
                      <td>
                        {isBroken ? (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--danger-bg)', color: 'var(--danger)', fontWeight: 700, fontSize: '11px' }}>
                            {l.statusCode || 'Error'}
                          </span>
                        ) : isRedirect ? (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--warning-bg)', color: 'var(--warning)', fontWeight: 700, fontSize: '11px' }}>
                            {l.statusCode} Redirect
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 700, fontSize: '11px' }}>
                            200 OK
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{l.text || '[No Anchor Text]'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all' }}>
                        <a href={l.url || l.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                          {l.url || l.href}
                        </a>
                      </td>
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {l.isInternal ? 'Internal' : l.type ? l.type : 'External'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching links found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
