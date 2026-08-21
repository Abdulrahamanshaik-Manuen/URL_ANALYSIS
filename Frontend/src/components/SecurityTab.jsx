import React from 'react';
import { Lock, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function SecurityTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const ssl = checks.ssl || {};
  const sec = checks.security || {};
  const headers = sec.headers || {};
  const mixed = sec.mixedContent || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SSL / TLS Certificate Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Lock size={18} style={{ color: ssl.valid ? 'var(--success)' : 'var(--danger)' }} />
            <span>SSL / TLS Certificate Deep-Dive</span>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: ssl.valid ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: ssl.valid ? 'var(--success)' : 'var(--danger)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {ssl.valid ? 'Valid SSL' : 'Invalid / Insecure'}
          </span>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Certificate Issuer</div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
              {ssl.issuer?.organization || ssl.issuer?.commonName || ssl.issuer?.O || ssl.issuer?.CN || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Subject (Common Name)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              {ssl.subject?.commonName || ssl.subject?.organization || ssl.subject?.CN || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Days Remaining</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: (ssl.daysRemaining || 0) > 30 ? 'var(--success)' : 'var(--warning)' }}>
              {ssl.daysRemaining !== null && ssl.daysRemaining !== undefined ? `${ssl.daysRemaining} days` : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Protocol & Cipher</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {typeof ssl.protocol === 'string' ? ssl.protocol : 'TLS 1.3'} ({typeof ssl.cipher === 'object' && ssl.cipher !== null ? (ssl.cipher.name || ssl.cipher.standardName || 'Modern Cipher') : (typeof ssl.cipher === 'string' ? ssl.cipher : 'Modern Cipher')})
            </div>
          </div>
        </div>
      </div>

      {/* HTTP Security Headers Checklist */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>HTTP Security Headers Compliance</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Score: {sec.securityScore || 0} / 100
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Security Header</th>
                <th>Status</th>
                <th>Configured Value</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(headers).filter(([k]) => k !== 'infoLeakage').map(([key, h]) => (
                <tr key={key}>
                  <td><strong>{h.name || key}</strong></td>
                  <td>
                    {h.present ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> Present
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontWeight: 600 }}>
                        <XCircle size={16} /> Missing
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', maxWidth: '300px', wordBreak: 'break-all' }}>
                    {h.value || 'None'}
                  </td>
                  <td style={{ color: h.recommendation ? 'var(--warning)' : 'var(--text-muted)', fontSize: '12px' }}>
                    {h.recommendation || 'Properly configured'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mixed Content Audit */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShieldAlert size={18} style={{ color: mixed.hasMixedContent ? 'var(--danger)' : 'var(--success)' }} />
            <span>Mixed Content Insecure Resource Scanner</span>
          </div>
        </div>

        {mixed.hasMixedContent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>
              Found {mixed.count} insecure HTTP resource(s) referenced on this HTTPS page!
            </p>
            {mixed.items?.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              >
                [{item.type.toUpperCase()}] {item.url}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--success)', fontSize: '13px' }}>
            No mixed-content vulnerabilities detected. All embedded resources load securely over HTTPS.
          </p>
        )}
      </div>
    </div>
  );
}
