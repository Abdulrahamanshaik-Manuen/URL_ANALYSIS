import React from 'react';
import { Image, FileCode, Layers, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function AssetsTab({ data }) {
  if (!data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <Image size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
        <h4 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Awaiting Assets & Images Inspection</h4>
        <p style={{ fontSize: '13px', margin: 0 }}>Enter a target URL above and click <strong>Inspect Website</strong> to populate real-time asset data.</p>
      </div>
    );
  }

  const { checks = {} } = data;
  const res = checks.resources || {};
  const sum = res.summary || {};
  const broken = res.broken || [];
  const images = res.images?.sample || [];
  const stylesheets = res.stylesheets?.sample || [];
  const scripts = res.scripts?.sample || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Assets Grid */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-label">Total Images</div>
          <div className="stat-box-value">{sum.totalImages || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">CSS Stylesheets</div>
          <div className="stat-box-value">{sum.totalStylesheets || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">JavaScript Files</div>
          <div className="stat-box-value">{sum.totalScripts || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Web Fonts</div>
          <div className="stat-box-value">{sum.totalFonts || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Broken Assets</div>
          <div className="stat-box-value" style={{ color: broken.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {broken.length}
          </div>
        </div>
      </div>

      {/* Broken Assets Warning Card */}
      {broken.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
              <span>Broken Assets & Media References ({broken.length})</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {broken.map((b, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                <strong style={{ color: 'var(--danger)', marginRight: '8px' }}>[{b.statusCode || 'FAILED'}]</strong>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{b.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Breakdown & Modern Format Audit */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Image size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Images & Optimization Audit</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
            <span>Missing Dimensions: <strong>{sum.imagesMissingDimensions || 0}</strong></span>
            <span>Legacy Formats: <strong>{sum.legacyFormatImages || 0}</strong></span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Image Source URL</th>
                <th>Alt Attribute</th>
                <th>Format</th>
                <th>Dimensions</th>
              </tr>
            </thead>
            <tbody>
              {images.slice(0, 20).map((img, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all' }}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                      {img.url}
                    </a>
                  </td>
                  <td>
                    {img.hasAlt ? (
                      <span style={{ color: 'var(--success)' }}>"{img.alt}"</span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Missing</span>
                    )}
                  </td>
                  <td>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: img.isModernFormat ? 'var(--success-bg)' : 'var(--bg-tertiary)', color: img.isModernFormat ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>
                      {img.format?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>{img.hasDimensions ? `${img.width}x${img.height}` : <span style={{ color: 'var(--warning)' }}>Not Set</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
