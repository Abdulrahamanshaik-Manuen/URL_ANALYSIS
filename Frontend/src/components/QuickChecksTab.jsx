import React, { useState } from 'react';
import { Zap, Shield, Server, Activity, Loader2, Code, Eye } from 'lucide-react';
import { runQuickCheck } from '../Services/apiService';

export default function QuickChecksTab({ currentUrl = '' }) {
  const [targetUrl, setTargetUrl] = useState(currentUrl || 'https://example.com');
  const [results, setResults] = useState({});
  const [loadingType, setLoadingType] = useState(null);
  const [viewModes, setViewModes] = useState({}); // { [toolId]: 'visual' | 'json' }

  const handleRunCheck = async (type) => {
    if (!targetUrl.trim()) return;
    setLoadingType(type);
    try {
      const res = await runQuickCheck(type, targetUrl);
      setResults(prev => ({ ...prev, [type]: res }));
    } catch (err) {
      setResults(prev => ({ ...prev, [type]: { error: err.message } }));
    } finally {
      setLoadingType(null);
    }
  };

  const toggleViewMode = (toolId) => {
    setViewModes(prev => ({
      ...prev,
      [toolId]: prev[toolId] === 'json' ? 'visual' : 'json'
    }));
  };

  const tools = [
    { id: 'dns', name: 'Instant DNS Lookup', icon: Server, desc: 'Query A, AAAA, NS, MX, and TXT DNS records instantly.' },
    { id: 'ssl', name: 'Instant SSL Expiry Check', icon: Shield, desc: 'Verify certificate issuer, TLS cipher, and remaining valid days.' },
    { id: 'ping', name: 'HTTP Availability Ping', icon: Activity, desc: 'Ping target server for instant status code and response latency.' },
    { id: 'security', name: 'Security Header Scan', icon: Zap, desc: 'Check CSP, HSTS, X-Frame-Options, and CORS configuration.' }
  ];

  const renderFormattedResult = (type, res) => {
    const data = res?.data || res;
    if (!data) return null;

    switch (type) {
      case 'dns': {
        const records = data.records || {};
        const aRecords = records.a || records.A || [];
        const aaaaRecords = records.aaaa || records.AAAA || [];
        const nsRecords = records.ns || records.NS || [];
        const mxRecords = records.mx || records.MX || [];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Status:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.resolved ? 'Resolved' : 'Failed'} ({data.responseTimeMs || 0} ms)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Primary IPv4 (A):</span>
              <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{aRecords.length > 0 ? aRecords.join(', ') : 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>IPv6 (AAAA):</span>
              <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{aaaaRecords.length > 0 ? aaaaRecords.join(', ') : 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Name Servers (NS):</span>
              <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{nsRecords.length > 0 ? nsRecords.join(', ') : 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>MX Records:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>
                {mxRecords.length > 0
                  ? mxRecords.map(m => typeof m === 'object' ? `${m.exchange || m.host || ''} (Priority ${m.priority})` : m).join(', ')
                  : 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>DNSSEC:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.dnssec ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        );
      }

      case 'ssl': {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>SSL Validity:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.valid ? 'Valid Certificate' : (data.error || 'Invalid / Unable to verify')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Issuer Authority:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.issuer?.O || data.issuer?.CN || (typeof data.issuer === 'string' ? data.issuer : 'N/A')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Days Remaining:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.daysRemaining !== undefined && data.daysRemaining !== null ? `${data.daysRemaining} days` : 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>TLS Protocol:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.protocol || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Cipher Algorithm:</span>
              <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.cipher || 'N/A'}</span>
            </div>
          </div>
        );
      }

      case 'ping':
      case 'availability': {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Server Status:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.available ? `Online (${data.statusCode || 200})` : 'Offline'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Response Latency:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.responseTimeMs || data.responseTime || 0} ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Target Host:</span>
              <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.url || data.hostname || targetUrl}</span>
            </div>
          </div>
        );
      }

      case 'security': {
        const headers = data.headers || data.securityHeaders || {};
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Security Score:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.securityScore || data.score || 0} / 100</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>HTTPS Encryption:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{data.isHttps ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>HSTS Header:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{headers.hsts?.present || headers['strict-transport-security'] ? 'Present' : 'Missing'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Content-Security-Policy:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{headers.csp?.present || headers['content-security-policy'] ? 'Present' : 'Missing'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>X-Frame-Options:</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{headers.xFrame?.present || headers['x-frame-options'] ? 'Present' : 'Missing'}</span>
            </div>
          </div>
        );
      }

      default:
        return (
          <pre className="code-block" style={{ maxHeight: '180px', padding: '8px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            style={{ fontSize: '15px', padding: '12px 16px' }}
            placeholder="https://example.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="dashboard-grid" style={{ alignItems: 'start' }}>
        {tools.map(t => {
          const Icon = t.icon;
          const isLoading = loadingType === t.id;
          const result = results[t.id];
          const isJsonMode = viewModes[t.id] === 'json';

          return (
            <div key={t.id} className="card" style={{ alignSelf: 'start' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span>{t.name}</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 'auto', flexShrink: 0 }}
                  onClick={() => handleRunCheck(t.id)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={14} className="spinner-icon" /> : <Zap size={14} />}
                  <span>Run</span>
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                {t.desc}
              </p>

              {result && (
                <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', fontSize: '12px' }}>
                  {result.error ? (
                    <span style={{ color: 'var(--danger)' }}>Error: {result.error}</span>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button
                          onClick={() => toggleViewMode(t.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={isJsonMode ? 'Switch to Human Readable Text' : 'Switch to Raw JSON'}
                        >
                          {isJsonMode ? <Eye size={12} /> : <Code size={12} />}
                          <span>{isJsonMode ? 'Text View' : 'Raw JSON'}</span>
                        </button>
                      </div>

                      {isJsonMode ? (
                        <pre className="code-block" style={{ maxHeight: '180px', padding: '8px', margin: 0 }}>
                          {JSON.stringify(result.data || result, null, 2)}
                        </pre>
                      ) : (
                        renderFormattedResult(t.id, result)
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
