import React from 'react';
import { Zap, Clock, Gauge, ArrowDownToLine, Cpu, Server } from 'lucide-react';

export default function PerformanceTab({ data }) {
  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <Zap size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Awaiting Performance Inspection</h4>
        <p style={{ fontSize: '13px', margin: 0 }}>Enter a target URL above and click <strong>Inspect Website</strong> to populate real-time performance data.</p>
      </div>
    );
  }

  const { checks = {} } = data;
  const perf = checks.performance || {};
  const browser = checks.browser || {};
  const metrics = browser.metrics || {};

  const totalTime = perf.totalTime || 0;
  const dnsTime = perf.dnsTime || 0;
  const tcpTime = perf.tcpTime || 0;
  const tlsTime = perf.tlsTime || 0;
  const ttfb = perf.ttfb || 0;
  const downloadTime = perf.downloadTime || 0;

  const getLatencyColor = (ms) => {
    if (ms < 300) return 'var(--success)';
    if (ms < 1000) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Core Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-label">Time to First Byte (TTFB)</div>
          <div className="stat-box-value" style={{ color: getLatencyColor(ttfb) }}>
            {ttfb} ms
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Total Response Time</div>
          <div className="stat-box-value" style={{ color: getLatencyColor(totalTime) }}>
            {totalTime} ms
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">First Contentful Paint (FCP)</div>
          <div className="stat-box-value" style={{ color: metrics.fcpMs ? getLatencyColor(metrics.fcpMs) : 'var(--text-muted)' }}>
            {metrics.fcpMs ? `${metrics.fcpMs} ms` : 'N/A'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">DOMContentLoaded</div>
          <div className="stat-box-value">
            {metrics.domContentLoadedMs ? `${metrics.domContentLoadedMs} ms` : 'N/A'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Page Payload Size</div>
          <div className="stat-box-value">
            {perf.pageSizeBytes ? `${(perf.pageSizeBytes / 1024).toFixed(1)} KB` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Network Timing Waterfall */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Network Latency Waterfall Breakdown</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* DNS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>DNS Lookup Latency</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{dnsTime} ms</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (dnsTime / (totalTime || 1)) * 100)}%`, background: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          {/* TCP */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>TCP Connect Handshake</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{tcpTime} ms</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (tcpTime / (totalTime || 1)) * 100)}%`, background: 'var(--accent-indigo)' }}
              />
            </div>
          </div>

          {/* TLS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>TLS / SSL Negotiation</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{tlsTime} ms</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (tlsTime / (totalTime || 1)) * 100)}%`, background: 'var(--accent-purple)' }}
              />
            </div>
          </div>

          {/* TTFB */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Server Processing (TTFB)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{ttfb} ms</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (ttfb / (totalTime || 1)) * 100)}%`, background: 'var(--warning)' }}
              />
            </div>
          </div>

          {/* Download */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Content Transfer / Download</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{downloadTime} ms</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (downloadTime / (totalTime || 1)) * 100)}%`, background: 'var(--success)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
