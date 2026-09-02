import React from 'react';
import { Globe, ArrowRight, Server, Clock, ShieldCheck, FileText } from 'lucide-react';

export default function HttpNetworkTab({ data }) {
  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <Globe size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Awaiting HTTP Inspection</h4>
        <p style={{ fontSize: '13px', margin: 0 }}>Enter a target URL above and click <strong>Inspect Website</strong> to populate real-time HTTP network data.</p>
      </div>
    );
  }

  const { checks = {} } = data;
  const perf = checks.performance || {};
  const redirects = checks.redirects || {};
  const avail = checks.availability || {};
  const dns = checks.dns || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HTTP Overview Cards */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Globe size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>HTTP Status & Protocol</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status Code:</span>
              <strong style={{ color: (perf.statusCode || avail.statusCode) < 400 ? 'var(--success)' : 'var(--danger)' }}>
                {perf.statusCode || avail.statusCode || 'N/A'} {perf.statusText || avail.statusText || ''}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>HTTP Version:</span>
              <span>{perf.httpVersion || avail.httpVersion || 'HTTP/1.1'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Page Size Payload:</span>
              <span>{perf.pageSizeBytes ? `${(perf.pageSizeBytes / 1024).toFixed(1)} KB` : 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Request Time:</span>
              <span>{perf.totalTime ? `${perf.totalTime} ms` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>DNS Resolution & IP Addresses</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary IPv4 (A):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{dns.records?.a?.[0] || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>IPv6 (AAAA):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{dns.records?.aaaa?.[0] || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Name Servers (NS):</span>
              <span>{dns.records?.ns?.length || 0} configured</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>MX Records:</span>
              <span>{dns.records?.mx?.length || 0} records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Redirect Chain */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ArrowRight size={18} style={{ color: 'var(--accent-indigo)' }} />
            <span>Redirect Chain ({redirects.count || 0} Hop{redirects.count === 1 ? '' : 's'})</span>
          </div>
        </div>

        {redirects.chain && redirects.chain.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {redirects.chain.map((hop, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  fontSize: '13px'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>#{i + 1}</span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: hop.statusCode >= 300 && hop.statusCode < 400 ? 'var(--warning-bg)' : 'var(--success-bg)',
                    color: hop.statusCode >= 300 && hop.statusCode < 400 ? 'var(--warning)' : 'var(--success)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600
                  }}
                >
                  {hop.statusCode}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{hop.url}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Direct connection (No redirects detected before final destination).
          </p>
        )}
      </div>

      {/* Response Headers Table */}
      {perf.headers && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FileText size={18} style={{ color: 'var(--accent-purple)' }} />
              <span>HTTP Response Headers</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {Object.keys(perf.headers).length} headers received
            </span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Header Key</th>
                  <th>Header Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(perf.headers).map(([key, val]) => (
                  <tr key={key}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                      {key}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                      {Array.isArray(val) ? val.join('; ') : String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

