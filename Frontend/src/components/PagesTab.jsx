import React, { useState } from 'react';
import { Compass, CheckCircle2, AlertTriangle, XCircle, Search, ExternalLink, ArrowRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export default function PagesTab({ pages = [], siteHealthScore = 0, onInspectPage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPages = pages.filter(page => {
    const matchesSearch =
      page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (page.title && page.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ok') return matchesSearch && page.statusCode < 400;
    if (statusFilter === 'error') return matchesSearch && page.statusCode >= 400;
    if (statusFilter === 'issues') return matchesSearch && (page.jsErrorsCount > 0 || page.brokenLinksCount > 0);

    return matchesSearch;
  });

  const totalCrawled = pages.length;
  const okPagesCount = pages.filter(p => p.statusCode < 400).length;
  const errorPagesCount = pages.filter(p => p.statusCode >= 400).length;
  const totalJsErrors = pages.reduce((acc, p) => acc + (p.jsErrorsCount || 0), 0);
  const totalBrokenLinks = pages.reduce((acc, p) => acc + (p.brokenLinksCount || 0), 0);

  return (
    <div className="tab-pane">
      {/* Header Overview Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={20} style={{ color: 'var(--accent-blue)' }} />
              <span>Full Website Crawl Results ({totalCrawled} Pages)</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Comprehensive multi-page audit report across internal same-domain routes
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Site Health Score</span>
              <div style={{ fontSize: '24px', fontWeight: 700, color: siteHealthScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                {siteHealthScore > 0 ? `${siteHealthScore} / 100` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Healthy Pages</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>{okPagesCount}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HTTP Error Pages</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: errorPagesCount > 0 ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <XCircle size={16} />
              <span>{errorPagesCount}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total JS Exceptions</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: totalJsErrors > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {totalJsErrors}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Site Broken Links</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: totalBrokenLinks > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {totalBrokenLinks}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="url-input-wrapper" style={{ maxWidth: '360px', height: '40px' }}>
          <Search size={16} className="url-icon" />
          <input
            type="text"
            className="url-input-field"
            placeholder="Search crawled page title or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '13px', paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn-secondary ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            style={{ height: '36px', fontSize: '12px', padding: '0 14px' }}
          >
            All Pages ({pages.length})
          </button>

          <button
            className={`btn-secondary ${statusFilter === 'ok' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ok')}
            style={{ height: '36px', fontSize: '12px', padding: '0 14px' }}
          >
            Healthy 200 OK ({okPagesCount})
          </button>

          <button
            className={`btn-secondary ${statusFilter === 'error' ? 'active' : ''}`}
            onClick={() => setStatusFilter('error')}
            style={{ height: '36px', fontSize: '12px', padding: '0 14px' }}
          >
            Errors ({errorPagesCount})
          </button>
        </div>
      </div>

      {/* Crawled Pages Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '14px 16px' }}>Page URL & Title</th>
                <th style={{ padding: '14px 16px', width: '100px' }}>Status</th>
                <th style={{ padding: '14px 16px', width: '110px' }}>Health Score</th>
                <th style={{ padding: '14px 16px', width: '100px' }}>Response</th>
                <th style={{ padding: '14px 16px', width: '120px' }}>Issues</th>
                <th style={{ padding: '14px 16px', width: '110px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No crawled pages match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredPages.map((page, index) => {
                  const isOk = page.statusCode < 400;
                  const hasIssues = page.jsErrorsCount > 0 || page.brokenLinksCount > 0;

                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {page.title || page.path}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{page.url}</span>
                          <a href={page.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span className={`tab-badge ${isOk ? 'success' : 'danger'}`}>
                          {page.statusCode} {page.statusText}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontWeight: 700,
                          color: page.healthScore >= 80 ? 'var(--success)' : page.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {page.healthScore} / 100
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {page.responseTimeMs} ms
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {hasIssues ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                            {page.jsErrorsCount > 0 && <span style={{ color: 'var(--warning)' }}>{page.jsErrorsCount} JS Errors</span>}
                            {page.brokenLinksCount > 0 && <span style={{ color: 'var(--danger)' }}>{page.brokenLinksCount} Broken Links</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '12px' }}>Clean</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {page.details && (
                          <button
                            className="btn-secondary"
                            onClick={() => onInspectPage(page.details)}
                            style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                            title="Inspect page analysis in dashboard"
                          >
                            <span>Inspect</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
