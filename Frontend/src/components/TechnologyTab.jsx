import React from 'react';
import { Cpu, Server, Layout, Sparkles, BarChart2, Cloud } from 'lucide-react';

export default function TechnologyTab({ data }) {
  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <Cpu size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Awaiting Technology Inspection</h4>
        <p style={{ fontSize: '13px', margin: 0 }}>Enter a target URL above and click <strong>Inspect Website</strong> to populate real-time technology stack data.</p>
      </div>
    );
  }

  const { checks = {} } = data;
  const tech = checks.technology || {};
  const cats = tech.byCategory || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Detected Technology Stack ({tech.count || 0} Signatures)</span>
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          {/* Web Server */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              <Server size={14} /> <span>Web Server</span>
            </div>
            {cats.servers?.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {cats.servers.map((s, i) => (
                  <span key={i} className="tab-badge" style={{ background: 'var(--accent-primary)', color: '#fff', padding: '4px 10px', fontSize: '12px' }}>
                    {typeof s === 'object' ? (s.name || s.version || 'Server') : String(s)}
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unknown / Hidden</span>}
          </div>

          {/* CMS & Platforms */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              <Layout size={14} /> <span>CMS & Platforms</span>
            </div>
            {cats.cms?.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {cats.cms.map((c, i) => (
                  <span key={i} className="tab-badge" style={{ background: 'var(--accent-purple)', color: '#fff', padding: '4px 10px', fontSize: '12px' }}>
                    {typeof c === 'object' ? (c.name || 'CMS') : String(c)} {c.category ? `(${c.category})` : ''}
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Custom Build / No CMS</span>}
          </div>

          {/* JS Frameworks */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              <Sparkles size={14} /> <span>JavaScript Frameworks & UI</span>
            </div>
            {cats.frameworks?.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {cats.frameworks.map((f, i) => (
                  <span key={i} className="tab-badge" style={{ background: 'var(--accent-cyan)', color: '#000', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}>
                    {typeof f === 'object' ? (f.name || 'Framework') : String(f)}
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Vanilla JS / Static</span>}
          </div>

          {/* CDN & Cloud */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              <Cloud size={14} /> <span>CDN & Cloud Infrastructure</span>
            </div>
            {cats.cdn?.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {cats.cdn.map((c, i) => (
                  <span key={i} className="tab-badge" style={{ background: 'var(--info)', color: '#fff', padding: '4px 10px', fontSize: '12px' }}>
                    {typeof c === 'object' ? (c.name || 'CDN') : String(c)}
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Direct Origin Server</span>}
          </div>

          {/* Analytics */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              <BarChart2 size={14} /> <span>Analytics & Tags</span>
            </div>
            {cats.analytics?.length > 0 ? (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {cats.analytics.map((a, i) => (
                  <span key={i} className="tab-badge" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 10px', fontSize: '12px' }}>
                    {typeof a === 'object' ? (a.name || 'Analytics') : String(a)}
                  </span>
                ))}
              </div>
            ) : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No analytics detected</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
