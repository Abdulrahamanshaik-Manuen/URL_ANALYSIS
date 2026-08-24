import React, { useState } from 'react';
import {
  Activity,
  Shield,
  Zap,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Maximize2,
  Lock,
  Globe,
  Clock,
  Layers,
  X
} from 'lucide-react';

export default function OverviewTab({ data, isLoading }) {
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const { scores = {}, summary = {}, diagnostics = {}, checks = {} } = data || {};
  const hasData = !!data;
  const overall = hasData ? (scores.overall || 0) : null;
  const rating = hasData ? (scores.rating || 'N/A') : 'Awaiting URL';
  const screenshot = checks.browser?.screenshot;
  const browserError = checks.browser?.error;

  const ratingClass =
    !hasData
      ? 'rating-fair'
      : rating === 'Excellent'
      ? 'rating-excellent'
      : rating === 'Good'
      ? 'rating-good'
      : rating === 'Fair'
      ? 'rating-fair'
      : 'rating-poor';

  // SVG Circle calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasData ? (circumference - (overall / 100) * circumference) : circumference;

  const getScoreColor = (val) => {
    if (!hasData || val === null || val === undefined) return 'var(--text-muted)';
    if (val >= 90) return 'var(--success)';
    if (val >= 75) return 'var(--info)';
    if (val >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div>
      {/* Top Grid: Health Score + Category Bars + Key Stats */}
      <div className="dashboard-grid">
        {/* Card 1: Overall Health Score */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Overall Health Score</span>
            </div>
            <span className={`rating-pill ${ratingClass}`}>{rating}</span>
          </div>

          <div className="health-meter-container">
            <div className="circle-meter">
              <svg width="120" height="120" className="score-circle-svg">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="var(--bg-tertiary)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={getScoreColor(overall)}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div className="score-text">
                <div className="score-number" style={{ color: getScoreColor(overall) }}>
                  {hasData && overall !== null ? overall : '--'}
                </div>
                <div className="score-label">/ 100</div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Composite score calculated across Availability, Performance, Security, SEO, and Accessibility domains.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{hasData ? data.targetUrl : 'Awaiting URL submission...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>Domain Score Breakdown</span>
            </div>
          </div>

          <div className="category-bars">
            <div className="cat-row">
              <div className="cat-header">
                <span>Availability & Uptime</span>
                <span style={{ color: getScoreColor(scores.availability || 0) }}>{hasData ? (scores.availability || 0) : 0}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${hasData ? (scores.availability || 0) : 0}%`, background: getScoreColor(scores.availability || 0) }}
                />
              </div>
            </div>

            <div className="cat-row">
              <div className="cat-header">
                <span>Performance & Speed</span>
                <span style={{ color: getScoreColor(scores.performance || 0) }}>{hasData ? (scores.performance || 0) : 0}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${hasData ? (scores.performance || 0) : 0}%`, background: getScoreColor(scores.performance || 0) }}
                />
              </div>
            </div>

            <div className="cat-row">
              <div className="cat-header">
                <span>Security & SSL</span>
                <span style={{ color: getScoreColor(scores.security || 0) }}>{hasData ? (scores.security || 0) : 0}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${hasData ? (scores.security || 0) : 0}%`, background: getScoreColor(scores.security || 0) }}
                />
              </div>
            </div>

            <div className="cat-row">
              <div className="cat-header">
                <span>SEO & Discoverability</span>
                <span style={{ color: getScoreColor(scores.seo || 0) }}>{hasData ? (scores.seo || 0) : 0}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${hasData ? (scores.seo || 0) : 0}%`, background: getScoreColor(scores.seo || 0) }}
                />
              </div>
            </div>

            <div className="cat-row">
              <div className="cat-header">
                <span>Accessibility (a11y)</span>
                <span style={{ color: getScoreColor(scores.accessibility || 0) }}>{hasData ? (scores.accessibility || 0) : 0}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${hasData ? (scores.accessibility || 0) : 0}%`, background: getScoreColor(scores.accessibility || 0) }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Live Captured Screenshot */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <Eye size={18} style={{ color: 'var(--accent-purple)' }} />
              <span>Live Browser Preview</span>
            </div>
          </div>

          {screenshot ? (
            <div className="browser-mock-container" onClick={() => setShowScreenshotModal(true)}>
              <div className="browser-mock-bar">
                <div className="browser-mock-url">{data.targetUrl}</div>
              </div>
              <div className="screenshot-wrapper">
                <img src={screenshot} alt="Website Screenshot" className="screenshot-img" />
                <div className="screenshot-overlay">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.6)', padding: '6px 14px', borderRadius: '20px' }}>
                    Click to view
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div
              style={{
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: 'var(--accent-purple)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px'
              }}
            >
              <div style={{ width: '28px', height: '28px', border: '3px solid var(--accent-purple)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <span>Capturing live browser screenshot with Playwright...</span>
            </div>
          ) : browserError ? (
            <div
              style={{
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--danger)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                padding: '16px',
                textAlign: 'center'
              }}
            >
              <AlertTriangle size={24} />
              <span style={{ fontWeight: 600 }}>Playwright Screenshot Unavailable</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {browserError}
              </span>
            </div>
          ) : (
            <div
              style={{
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                padding: '16px',
                textAlign: 'center'
              }}
            >
              <Eye size={24} style={{ opacity: 0.5 }} />
              <span>{hasData ? 'No browser screenshot captured' : 'Enter a URL above and click Inspect Website to capture live browser screenshot'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        <div className="stat-box">
          <div className="stat-box-label">HTTP Status</div>
          <div className="stat-box-value" style={{ color: !hasData ? 'var(--text-muted)' : (summary.statusCode < 400 ? 'var(--success)' : 'var(--danger)') }}>
            {hasData ? (summary.statusCode ? `${summary.statusCode} ${summary.statusText || ''}` : 'N/A') : '--'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Response Latency</div>
          <div className="stat-box-value">
            {hasData ? (summary.responseTimeMs ? `${summary.responseTimeMs} ms` : 'N/A') : '--'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">SSL Validity</div>
          <div className="stat-box-value" style={{ color: !hasData ? 'var(--text-muted)' : (summary.sslValid ? 'var(--success)' : 'var(--danger)') }}>
            {hasData ? (summary.sslValid ? `${summary.sslDaysRemaining}d remaining` : 'Invalid / Insecure') : '--'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">JS Console Errors</div>
          <div className="stat-box-value" style={{ color: !hasData ? 'var(--text-muted)' : (summary.jsErrorsCount > 0 ? 'var(--danger)' : 'var(--success)') }}>
            {hasData ? (summary.jsErrorsCount || 0) : '--'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Broken Links</div>
          <div className="stat-box-value" style={{ color: !hasData ? 'var(--text-muted)' : (summary.brokenLinksCount > 0 ? 'var(--warning)' : 'var(--success)') }}>
            {hasData ? (summary.brokenLinksCount || 0) : '--'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Tech Signatures</div>
          <div className="stat-box-value">
            {hasData ? (summary.technologiesCount || 0) : '--'}
          </div>
        </div>
      </div>

      {/* Critical Issues & Warnings Feed */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <span>Audit Findings & Issue Diagnostics</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {hasData ? `${(diagnostics.criticalIssues?.length || 0) + (diagnostics.warnings?.length || 0)} issues detected` : '0 issues'}
          </span>
        </div>

        <div className="issues-feed">
          {!hasData ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No active URL scan submitted yet. Enter a website URL above and click <strong>Inspect Website</strong>.
            </div>
          ) : (
            <>
              {diagnostics.criticalIssues?.map((iss, idx) => (
                <div key={`crit-${idx}`} className="issue-item critical">
                  <XCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                  <div className="issue-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span className="issue-domain-tag" style={{ background: 'var(--danger)', color: '#fff' }}>{iss.domain}</span>
                      <strong style={{ wordBreak: 'break-word' }}>{iss.title}</strong>
                    </div>
                    {iss.desc && <p>{iss.desc}</p>}
                  </div>
                </div>
              ))}

              {diagnostics.warnings?.map((warn, idx) => (
                <div key={`warn-${idx}`} className="issue-item warning">
                  <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                  <div className="issue-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span className="issue-domain-tag" style={{ background: 'var(--warning)', color: '#000' }}>{warn.domain}</span>
                      <strong style={{ wordBreak: 'break-word' }}>{warn.title}</strong>
                    </div>
                    {warn.desc && <p>{warn.desc}</p>}
                  </div>
                </div>
              ))}

              {diagnostics.passedChecks?.slice(0, 5).map((pass, idx) => (
                <div key={`pass-${idx}`} className="issue-item passed">
                  <CheckCircle2 size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                  <div className="issue-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="issue-domain-tag" style={{ background: 'var(--success)', color: '#fff' }}>{pass.domain}</span>
                      <span style={{ wordBreak: 'break-word' }}>{pass.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Full Screenshot Modal */}
      {showScreenshotModal && screenshot && (
        <div className="modal-overlay" onClick={() => setShowScreenshotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowScreenshotModal(false)}><X size={18} /></button>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Captured Browser Viewport</h3>
            <img src={screenshot} alt="Full Viewport" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
