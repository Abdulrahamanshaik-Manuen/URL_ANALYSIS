import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertCircle,
  LayoutGrid,
  List,
  Image as ImageIcon,
  X,
  Eye,
  Maximize2
} from 'lucide-react';

export default function PagesTab({ pages = [], siteHealthScore = 0, onInspectPage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'ok' | 'error' | 'issues'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedPageModal, setSelectedPageModal] = useState(null);

  const filteredPages = pages.filter(page => {
    const matchesSearch =
      page.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (page.title && page.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ok') return matchesSearch && page.statusCode < 400;
    if (statusFilter === 'error') return matchesSearch && page.statusCode >= 400;
    if (statusFilter === 'issues') return matchesSearch && (page.jsErrorsCount > 0 || page.brokenLinksCount > 0 || page.a11yIssuesCount > 0);

    return matchesSearch;
  });

  const totalCrawled = pages.length;
  const okPagesCount = pages.filter(p => p.statusCode < 400).length;
  const errorPagesCount = pages.filter(p => p.statusCode >= 400).length;
  const totalJsErrors = pages.reduce((acc, p) => acc + (p.jsErrorsCount || 0), 0);
  const totalBrokenLinks = pages.reduce((acc, p) => acc + (p.brokenLinksCount || 0), 0);
  const totalA11yIssues = pages.reduce((acc, p) => acc + (p.a11yIssuesCount || 0), 0);

  // Helper to extract screenshot URL (Cloudinary or Base64 fallback)
  const getPageScreenshot = (page) => {
    if (page.screenshotUrl) return page.screenshotUrl;
    if (page.details?.checks?.browser?.screenshot) return page.details.checks.browser.screenshot;
    if (page.details?.screenshotUrl) return page.details.screenshotUrl;
    return null;
  };

  return (
    <div className="tab-pane">
      {/* Header Overview Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={20} style={{ color: 'var(--accent-blue)' }} />
              <span>Full Website Crawl & Page-by-Page Report ({totalCrawled} Pages)</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Discovered and audited internal same-domain pages with screenshots and error tracking
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Site Health Score</span>
              <div style={{ fontSize: '24px', fontWeight: 700, color: siteHealthScore >= 80 ? 'var(--success)' : siteHealthScore >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                {siteHealthScore > 0 ? `${siteHealthScore} / 100` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '20px' }}>
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

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>A11y Violations</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: totalA11yIssues > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
              {totalA11yIssues}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & View Mode Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="url-input-wrapper" style={{ maxWidth: '320px', height: '38px' }}>
            <Search size={16} className="url-icon" />
            <input
              type="text"
              className="url-input-field"
              placeholder="Search page title or URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px', paddingLeft: '38px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-secondary ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
              style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
            >
              All ({pages.length})
            </button>

            <button
              className={`btn-secondary ${statusFilter === 'ok' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ok')}
              style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
            >
              Healthy ({okPagesCount})
            </button>

            <button
              className={`btn-secondary ${statusFilter === 'error' ? 'active' : ''}`}
              onClick={() => setStatusFilter('error')}
              style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
            >
              Errors ({errorPagesCount})
            </button>

            <button
              className={`btn-secondary ${statusFilter === 'issues' ? 'active' : ''}`}
              onClick={() => setStatusFilter('issues')}
              style={{ height: '34px', fontSize: '12px', padding: '0 12px' }}
            >
              With Issues
            </button>
          </div>
        </div>

        {/* View Switcher (Grid vs Table) */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            className={`btn-secondary ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            style={{ height: '30px', padding: '0 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', border: 'none' }}
            title="Visual Screenshot Grid View"
          >
            <LayoutGrid size={14} />
            <span>Grid Cards</span>
          </button>
          <button
            className={`btn-secondary ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            style={{ height: '30px', padding: '0 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', border: 'none' }}
            title="Table List View"
          >
            <List size={14} />
            <span>Table List</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL SCREENSHOT GRID VIEW */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredPages.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No scanned pages match your filter criteria.
            </div>
          ) : (
            filteredPages.map((page, index) => {
              const isOk = page.statusCode < 400;
              const screenshot = getPageScreenshot(page);
              const hasIssues = page.jsErrorsCount > 0 || page.brokenLinksCount > 0 || page.a11yIssuesCount > 0;

              return (
                <div
                  key={index}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Screenshot Container */}
                  <div
                    style={{
                      height: '160px',
                      background: '#0d1117',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedPageModal(page)}
                  >
                    {screenshot ? (
                      <img
                        src={screenshot}
                        alt={`Screenshot of ${page.title || page.url}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                        <ImageIcon size={28} />
                        <span style={{ fontSize: '11px' }}>No Screenshot</span>
                      </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                      <span className={`tab-badge ${isOk ? 'success' : 'danger'}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        {page.statusCode} {page.statusText}
                      </span>
                    </div>

                    {/* Score Badge Overlay */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: page.healthScore >= 80 ? 'var(--success)' : page.healthScore >= 60 ? 'var(--warning)' : 'var(--danger)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {page.healthScore}/100
                      </span>
                    </div>

                    {/* Hover Zoom Icon */}
                    <div className="hover-overlay" style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      opacity: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      transition: 'opacity 0.2s'
                    }}>
                      <Maximize2 size={24} style={{ color: '#fff' }} />
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.title || page.path}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '10px' }}>
                        {page.url}
                      </div>

                      {/* Issue summary pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {page.jsErrorsCount > 0 && (
                          <span style={{ fontSize: '11px', background: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                            {page.jsErrorsCount} JS Errors
                          </span>
                        )}
                        {page.brokenLinksCount > 0 && (
                          <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            {page.brokenLinksCount} Broken Links
                          </span>
                        )}
                        {page.a11yIssuesCount > 0 && (
                          <span style={{ fontSize: '11px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                            {page.a11yIssuesCount} A11y Violations
                          </span>
                        )}
                        {!hasIssues && isOk && (
                          <span style={{ fontSize: '11px', color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            Clean Page
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => setSelectedPageModal(page)}
                        style={{ flex: 1, height: '32px', fontSize: '12px', justifyContent: 'center' }}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      {page.details && onInspectPage && (
                        <button
                          className="btn-primary"
                          onClick={() => onInspectPage(page.details)}
                          style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                          title="Inspect full page details in main dashboard"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABLE LIST VIEW */}
      {viewMode === 'table' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 16px', width: '80px' }}>Preview</th>
                  <th style={{ padding: '14px 16px' }}>Page URL & Title</th>
                  <th style={{ padding: '14px 16px', width: '100px' }}>Status</th>
                  <th style={{ padding: '14px 16px', width: '110px' }}>Health Score</th>
                  <th style={{ padding: '14px 16px', width: '100px' }}>Response</th>
                  <th style={{ padding: '14px 16px', width: '130px' }}>Issues</th>
                  <th style={{ padding: '14px 16px', width: '110px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No crawled pages match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page, index) => {
                    const isOk = page.statusCode < 400;
                    const screenshot = getPageScreenshot(page);
                    const hasIssues = page.jsErrorsCount > 0 || page.brokenLinksCount > 0 || page.a11yIssuesCount > 0;

                    return (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                        {/* Thumbnail Cell */}
                        <td style={{ padding: '10px 16px' }}>
                          <div
                            style={{
                              width: '56px',
                              height: '38px',
                              borderRadius: '6px',
                              background: '#0d1117',
                              overflow: 'hidden',
                              border: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center'
                            }}
                            onClick={() => setSelectedPageModal(page)}
                          >
                            {screenshot ? (
                              <img src={screenshot} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <ImageIcon size={16} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                        </td>

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
                              {page.a11yIssuesCount > 0 && <span style={{ color: '#c084fc' }}>{page.a11yIssuesCount} A11y Violations</span>}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--success)', fontSize: '12px' }}>Clean</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {page.details && onInspectPage && (
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
      )}

      {/* PAGE SCREENSHOT & DIAGNOSTICS MODAL */}
      {selectedPageModal && (
        <div className="modal-overlay" onClick={() => setSelectedPageModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90vw' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedPageModal.title || selectedPageModal.path}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                  {selectedPageModal.url}
                </span>
              </div>
              <button className="theme-toggle-btn" onClick={() => setSelectedPageModal(null)} title="Close Modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Image Preview */}
              <div style={{
                background: '#0d1117',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                maxHeight: '400px',
                overflowY: 'auto',
                display: 'flex',
                justify: 'center',
                alignItems: 'flex-start',
                padding: '12px'
              }}>
                {getPageScreenshot(selectedPageModal) ? (
                  <img
                    src={getPageScreenshot(selectedPageModal)}
                    alt={`Screenshot of ${selectedPageModal.url}`}
                    style={{ width: '100%', borderRadius: '8px', display: 'block' }}
                  />
                ) : (
                  <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No screenshot available for this page.
                  </div>
                )}
              </div>

              {/* Page Diagnostics Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HTTP Status</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }} className={selectedPageModal.statusCode < 400 ? 'text-success' : 'text-danger'}>
                    {selectedPageModal.statusCode} {selectedPageModal.statusText}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Response Time</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: 'var(--accent-blue)' }}>
                    {selectedPageModal.responseTimeMs} ms
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Health Score</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: selectedPageModal.healthScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                    {selectedPageModal.healthScore} / 100
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JS Console Errors</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: selectedPageModal.jsErrorsCount > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {selectedPageModal.jsErrorsCount}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <a
                  href={selectedPageModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ height: '38px', padding: '0 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={15} />
                  <span>Open Page URL</span>
                </a>

                {selectedPageModal.details && onInspectPage && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const pageDetails = selectedPageModal.details;
                      setSelectedPageModal(null);
                      onInspectPage(pageDetails);
                    }}
                    style={{ height: '38px', padding: '0 18px' }}
                  >
                    <span>Inspect Full Report in Dashboard</span>
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


