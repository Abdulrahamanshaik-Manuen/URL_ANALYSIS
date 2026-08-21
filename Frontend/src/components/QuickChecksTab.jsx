import React, { useState } from 'react';
import { Zap, Shield, Server, Activity, Loader2, CheckCircle2 } from 'lucide-react';
import { runQuickCheck } from '../Services/apiService';

export default function QuickChecksTab({ currentUrl = '' }) {
  const [targetUrl, setTargetUrl] = useState(currentUrl || 'https://example.com');
  const [activeCheck, setActiveCheck] = useState(null);
  const [results, setResults] = useState({});
  const [loadingType, setLoadingType] = useState(null);

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

  const tools = [
    { id: 'dns', name: 'Instant DNS Lookup', icon: Server, desc: 'Query A, AAAA, NS, MX, and TXT DNS records instantly.' },
    { id: 'ssl', name: 'Instant SSL Expiry Check', icon: Shield, desc: 'Verify certificate issuer, TLS cipher, and remaining valid days.' },
    { id: 'ping', name: 'HTTP Availability Ping', icon: Activity, desc: 'Ping target server for instant status code and response latency.' },
    { id: 'security', name: 'Security Header Scan', icon: Zap, desc: 'Check CSP, HSTS, X-Frame-Options, and CORS configuration.' }
  ];

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

      <div className="dashboard-grid">
        {tools.map(t => {
          const Icon = t.icon;
          const isLoading = loadingType === t.id;
          const result = results[t.id];

          return (
            <div key={t.id} className="card">
              <div className="card-header">
                <div className="card-title">
                  <Icon size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span>{t.name}</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleRunCheck(t.id)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={14} className="spinner-icon" /> : <Zap size={14} />}
                  <span>Run Now</span>
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                {t.desc}
              </p>

              {result && (
                <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', fontSize: '12px' }}>
                  {result.error ? (
                    <span style={{ color: 'var(--danger)' }}>Error: {result.error}</span>
                  ) : (
                    <pre className="code-block" style={{ maxHeight: '180px', padding: '8px' }}>
                      {JSON.stringify(result.data || result, null, 2)}
                    </pre>
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
