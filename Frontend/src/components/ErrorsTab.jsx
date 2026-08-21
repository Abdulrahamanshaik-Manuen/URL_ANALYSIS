import React from 'react';
import { AlertOctagon, Terminal, WifiOff, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ErrorsTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const browser = checks.browser || {};
  const jsErrors = browser.jsErrors || [];
  const consoleErrors = browser.consoleMessages?.errors || [];
  const consoleWarnings = browser.consoleMessages?.warnings || [];
  const failedRequests = browser.failedRequests || [];
  const httpErrors = browser.httpErrors || [];

  const totalErrorsCount = jsErrors.length + consoleErrors.length + failedRequests.length + httpErrors.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Status Banner */}
      <div
        className="card"
        style={{
          borderLeft: `4px solid ${totalErrorsCount > 0 ? 'var(--danger)' : 'var(--success)'}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {totalErrorsCount > 0 ? (
            <AlertOctagon size={28} style={{ color: 'var(--danger)' }} />
          ) : (
            <CheckCircle2 size={28} style={{ color: 'var(--success)' }} />
          )}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
              {totalErrorsCount > 0
                ? `${totalErrorsCount} Runtime & Network Issue(s) Detected in Browser Inspection`
                : 'Clean Runtime: Zero Browser JavaScript or Network Errors Detected!'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Headless Playwright audit tracked runtime exceptions, console error streams, and failed network fetches.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Uncaught JavaScript Exceptions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Terminal size={18} style={{ color: 'var(--danger)' }} />
            <span>Uncaught JavaScript Exceptions ({jsErrors.length})</span>
          </div>
        </div>

        {jsErrors.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jsErrors.map((err, i) => (
              <div
                key={i}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '6px', fontSize: '14px' }}>
                  {err.message}
                </div>
                {err.stack && (
                  <pre className="code-block" style={{ color: '#fca5a5', marginTop: '6px' }}>
                    {err.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            No uncaught JavaScript runtime exceptions triggered during execution.
          </p>
        )}
      </div>

      {/* 2. Console Errors & Warnings */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <span>Browser Console Messages ({consoleErrors.length} Errors, {consoleWarnings.length} Warnings)</span>
          </div>
        </div>

        {consoleErrors.length > 0 || consoleWarnings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {consoleErrors.map((msg, i) => (
              <div
                key={`ce-${i}`}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: 'var(--danger)', fontWeight: 700, marginRight: '8px' }}>[Console Error]</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{typeof msg === 'object' ? msg.text : msg}</span>
              </div>
            ))}

            {consoleWarnings.map((msg, i) => (
              <div
                key={`cw-${i}`}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '13px'
                }}
              >
                <span style={{ color: 'var(--warning)', fontWeight: 700, marginRight: '8px' }}>[Console Warning]</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{typeof msg === 'object' ? msg.text : msg}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Console error log stream is clean.
          </p>
        )}
      </div>

      {/* 3. Failed Network Requests & 4xx/5xx HTTP Responses */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <WifiOff size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Failed Network Calls & HTTP 4xx/5xx Errors ({failedRequests.length + httpErrors.length})</span>
          </div>
        </div>

        {failedRequests.length > 0 || httpErrors.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Status / Failure</th>
                  <th>Resource Type</th>
                  <th>Failed URL</th>
                </tr>
              </thead>
              <tbody>
                {failedRequests.map((req, i) => (
                  <tr key={`fr-${i}`}>
                    <td><span style={{ fontWeight: 700 }}>{req.method || 'GET'}</span></td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-bg)', color: 'var(--danger)', fontWeight: 600 }}>
                        {req.failure}
                      </span>
                    </td>
                    <td>{req.resourceType}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{req.url}</td>
                  </tr>
                ))}
                {httpErrors.map((err, i) => (
                  <tr key={`he-${i}`}>
                    <td><span style={{ fontWeight: 700 }}>GET</span></td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--danger-bg)', color: 'var(--danger)', fontWeight: 600 }}>
                        {err.status} {err.statusText}
                      </span>
                    </td>
                    <td>{err.resourceType}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{err.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            All sub-resource network requests loaded successfully without 4xx/5xx errors or aborted connections.
          </p>
        )}
      </div>
    </div>
  );
}
