import React, { useState } from 'react';
import {
  Layers,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Globe,
  ExternalLink,
  Shield,
  Zap,
  Search,
  Lock,
  Smartphone,
  Eye,
  FileCode,
  Trash2
} from 'lucide-react';
import { bulkAnalyzeWebsites } from '../Services/apiService';

export default function BulkAnalyzerTab({ onLoadReport }) {
  const [urlInput, setUrlInput] = useState('');
  const [maxPagesPerSite, setMaxPagesPerSite] = useState(5);
  const [concurrency, setConcurrency] = useState(3);
  const [isAuditing, setIsAuditing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const sampleUrls = [
    'https://example.com',
    'https://jsonplaceholder.typicode.com',
    'https://httpbin.org'
  ].join('\n');

  const handleStartBatch = async () => {
    setError(null);
    const rawLines = urlInput.split('\n').map((line) => line.trim()).filter(Boolean);

    if (rawLines.length === 0) {
      setError('Please enter at least one URL to start the batch audit.');
      return;
    }

    setIsAuditing(true);
    setResults(null);

    try {
      const res = await bulkAnalyzeWebsites(rawLines, maxPagesPerSite, concurrency);
      setResults(res);
    } catch (err) {
      setError(err.message || 'Bulk website audit failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  const checkCategories = [
    { key: 'dns', label: 'DNS', icon: Globe },
    { key: 'ssl', label: 'SSL', icon: Lock },
    { key: 'performance', label: 'Speed', icon: Zap },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'seo', label: 'SEO', icon: Search },
    { key: 'accessibility', label: 'A11y', icon: Eye },
    { key: 'mobile', label: 'Mobile', icon: Smartphone }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>


      {/* URL Input Form Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
          Target URLs List <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>(Paste one URL per line)</span>
        </label>

        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={`https://example.com\nhttps://mysite.org\nhttps://shop.store.com`}
          rows={5}
          disabled={isAuditing}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            fontSize: '13px',
            resize: 'vertical',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Max Pages/Site:</label>
              <input
                type="number"
                min="1"
                placeholder="5 (or Unlimited)"
                value={maxPagesPerSite === Infinity || maxPagesPerSite === 0 ? '' : maxPagesPerSite}
                onChange={(e) => setMaxPagesPerSite(e.target.value === '' ? 0 : Number(e.target.value))}
                disabled={isAuditing}
                style={{
                  width: '90px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px', background: maxPagesPerSite === 0 || maxPagesPerSite === Infinity ? 'var(--accent-cyan)' : undefined, color: maxPagesPerSite === 0 || maxPagesPerSite === Infinity ? '#000' : undefined }}
                onClick={() => setMaxPagesPerSite(maxPagesPerSite === 0 || maxPagesPerSite === Infinity ? 5 : 0)}
              >
                {maxPagesPerSite === 0 || maxPagesPerSite === Infinity ? '∞ Unlimited' : 'Set Unlimited'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Parallel Workers:</label>
              <input
                type="number"
                min="1"
                value={concurrency}
                onChange={(e) => setConcurrency(Math.max(1, Number(e.target.value)))}
                disabled={isAuditing}
                style={{
                  width: '70px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {urlInput.trim() && (
              <button
                onClick={() => setUrlInput('')}
                disabled={isAuditing}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Trash2 size={14} /> Clear
              </button>
            )}

            <button
              onClick={handleStartBatch}
              disabled={isAuditing || !urlInput.trim()}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 700,
                opacity: isAuditing || !urlInput.trim() ? 0.6 : 1
              }}
            >
              {isAuditing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Running Multi-URL Batch...
                </>
              ) : (
                <>
                  <Play size={16} /> Start Multi-URL Audit
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Active Batch Progress Card */}
      {isAuditing && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--accent-cyan)' }}>
          <Loader2 size={24} className="spin-animation" style={{ color: 'var(--accent-cyan)' }} />
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Running Multi-URL Batch Audit in Parallel...
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Auditing submitted websites simultaneously with parallel workers. Results will populate into MongoDB Atlas shortly.
            </p>
          </div>
        </div>
      )}

      {/* Results Overview */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Submitted</span>
              <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{results.totalSubmitted}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'var(--success-bg)', borderColor: 'var(--success)' }}>
              <span style={{ fontSize: '11px', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 700 }}>Completed</span>
              <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>{results.completed}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', background: 'var(--danger-bg)', borderColor: 'var(--danger)' }}>
              <span style={{ fontSize: '11px', color: 'var(--danger)', textTransform: 'uppercase', fontWeight: 700 }}>Failed</span>
              <p style={{ fontSize: '24px', fontWeight: 900, color: 'var(--danger)', marginTop: '4px' }}>{results.failed}</p>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Batch Audit Results Table</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Persisted in MongoDB Atlas</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Target Website</th>
                    <th style={{ padding: '12px 16px' }}>Audit Status</th>
                    <th style={{ padding: '12px 16px' }}>Site Score</th>
                    <th style={{ padding: '12px 16px' }}>Pages Crawled</th>
                    <th style={{ padding: '12px 16px' }}>Checks Matrix</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '13px' }}>
                  {results.results.map((item, idx) => {
                    const auditData = item.data || {};
                    const score = auditData.siteHealthScore ?? auditData.scores?.overall ?? 0;
                    const rating = auditData.rating || (score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Poor');

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {item.url}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {item.status === 'completed' ? (
                            <span className="status-badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' }}>
                              <CheckCircle2 size={12} /> Completed
                            </span>
                          ) : (
                            <span className="status-badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                              <XCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '12px',
                                color: '#fff',
                                background: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
                              }}
                            >
                              {score}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{rating}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {auditData.totalPagesCrawled || auditData.pagesScanned || 1} Pages
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', items: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {checkCategories.map((c) => {
                              const CIcon = c.icon;
                              return (
                                <span
                                  key={c.key}
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--success)'
                                  }}
                                  title={`${c.label}: Verified & Saved`}
                                >
                                  <CIcon size={14} />
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {auditData.fullDetails || auditData.pages?.[0]?.details || auditData ? (
                            <button
                              onClick={() => {
                                if (onLoadReport) {
                                  const detailPayload = auditData.fullDetails || auditData.pages?.[0]?.details || (auditData.checks ? auditData : auditData);
                                  onLoadReport(detailPayload, auditData);
                                }
                              }}
                              className="btn-secondary"
                              style={{ fontSize: '11px', padding: '6px 12px' }}
                            >
                              <ExternalLink size={12} /> Inspect
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
