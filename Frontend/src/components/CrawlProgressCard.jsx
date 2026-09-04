import React from 'react';
import { Loader2, Compass, CheckCircle2, FileText, Globe } from 'lucide-react';

export default function CrawlProgressCard({ crawlState }) {
  const {
    discoveredCount = 0,
    crawledCount = 0,
    remainingCount = 0,
    currentUrl = '',
    siteHealthScore = 0,
    maxPages = 100,
    crawlingProgressText = ''
  } = crawlState || {};

  const totalPagesEstimate = Math.max(discoveredCount, crawledCount + remainingCount, 1);
  const progressText = crawlingProgressText || `Crawling ${crawledCount + 1} / ${totalPagesEstimate} pages`;
  const progressPercent = Math.min(100, Math.round((crawledCount / (maxPages || 25)) * 100));

  return (
    <div className="card" style={{
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--accent-blue)',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '28px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Compass size={24} className="spinner-icon" style={{ color: 'var(--accent-blue)' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Playwright Browser Crawler Active</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 500 }}>
              {progressText}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Site Score</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: siteHealthScore >= 80 ? 'var(--success)' : 'var(--warning)' }}>
              {siteHealthScore > 0 ? `${siteHealthScore} / 100` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          <span>Opening page in Playwright browser...</span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.max(5, progressPercent)}%`,
            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Live Metrics Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Discovered URLs</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{discoveredCount}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audited Pages</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>{crawledCount}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining Queue</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-blue)' }}>{remainingCount}</div>
        </div>
      </div>

      {currentUrl && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <Loader2 size={14} className="spinner-icon" style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Currently checking:</span>
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(() => {
              let u = currentUrl;
              if (u.includes('and~') || u.includes('~and') || u.includes('/?/') || u.includes('/&/') || u.length > 120) {
                u = u.replace(/(\/\?\/&.*|\/\?\/.*|\/&\/.*|~?and~?.*|(\/[^/]+)\2{2,}.*)/i, '');
              }
              return u.replace(/[?&]+$/, '').replace(/\/+$/, '');
            })()}
          </span>
        </div>
      )}
    </div>
  );
}
