import React from 'react';
import { Cookie, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function CookiesTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const cookieAudit = checks.cookies || {};
  const cookiesList = cookieAudit.cookies || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Cookie size={18} style={{ color: 'var(--accent-purple)' }} />
            <span>Cookies & Privacy Audit ({cookieAudit.count || 0} Cookie{cookieAudit.count === 1 ? '' : 's'})</span>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: cookieAudit.privacyScore >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: cookieAudit.privacyScore >= 80 ? 'var(--success)' : 'var(--warning)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            Privacy Score: {cookieAudit.privacyScore || 100} / 100
          </span>
        </div>

        {cookiesList.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Secure</th>
                  <th>HttpOnly</th>
                  <th>SameSite</th>
                  <th>Path / Domain</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {cookiesList.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{c.name}</strong>
                    </td>
                    <td>
                      {c.secure ? (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Yes</span>
                      ) : (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>No (Insecure)</span>
                      )}
                    </td>
                    <td>
                      {c.httpOnly ? (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>Yes</span>
                      ) : (
                        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>No</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{c.sameSite}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {c.path} ({c.domain || 'Host Only'})
                    </td>
                    <td>
                      {c.issues?.length > 0 ? (
                        <span style={{ color: 'var(--warning)', fontSize: '12px' }}>
                          {c.issues.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '12px' }}>Compliant</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            No HTTP response cookies were set by the target URL.
          </p>
        )}
      </div>

      {cookieAudit.recommendations?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              <span>Cookie Privacy Recommendations</span>
            </div>
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {cookieAudit.recommendations.map((rec, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
