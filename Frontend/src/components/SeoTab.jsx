import React from 'react';
import { Search, Share2, CheckCircle2, AlertTriangle, XCircle, Layout } from 'lucide-react';

export default function SeoTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const seo = checks.seo || {};
  const title = seo.title || {};
  const desc = seo.metaDescription || {};
  const headings = seo.headings || {};
  const og = seo.openGraph || {};
  const twitter = seo.twitterCard || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Description Cards */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Search size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>SEO Title Tag</span>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: title.status === 'optimal' ? 'var(--success)' : 'var(--warning)',
                fontWeight: 600
              }}
            >
              {title.length || 0} characters ({title.status})
            </span>
          </div>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', fontSize: '14px', fontWeight: 600 }}>
            {title.text || <span style={{ color: 'var(--danger)' }}>[Missing Title Tag]</span>}
          </div>
          {title.recommendation && (
            <p style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '8px' }}>
              {title.recommendation}
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layout size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>Meta Description</span>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: desc.status === 'optimal' ? 'var(--success)' : 'var(--warning)',
                fontWeight: 600
              }}
            >
              {desc.length || 0} characters ({desc.status})
            </span>
          </div>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', fontSize: '13px' }}>
            {desc.text || <span style={{ color: 'var(--danger)' }}>[Missing Meta Description Tag]</span>}
          </div>
          {desc.recommendation && (
            <p style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '8px' }}>
              {desc.recommendation}
            </p>
          )}
        </div>
      </div>

      {/* Canonical & Robots Directive */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <span>Indexing & Canonical Metadata</span>
          </div>
        </div>
        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Canonical URL</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', wordBreak: 'break-all' }}>
              {seo.canonical?.url || 'Not explicitly declared'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Robots Meta Directive</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              {seo.robotsDirective || 'index, follow'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Favicon Detected</div>
            <div style={{ fontSize: '13px' }}>
              {seo.favicon?.found ? 'Yes' : 'Missing'}
            </div>
          </div>
        </div>
      </div>

      {/* Social Graph Cards Preview (OpenGraph & Twitter) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Share2 size={18} style={{ color: 'var(--accent-indigo)' }} />
            <span>Social Graph Preview (OpenGraph & Twitter Cards)</span>
          </div>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          {/* OpenGraph Card Preview */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
            {og.image && (
              <img src={og.image} alt="OG Card" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '14px' }}>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                {og.site_name || 'OpenGraph Preview'}
              </span>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0' }}>{og.title || title.text || 'No OG Title'}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {og.description || desc.text || 'No OG Description provided'}
              </p>
            </div>
          </div>

          {/* Metadata Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Meta Property</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>og:title</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{og.title || 'None'}</td>
                </tr>
                <tr>
                  <td>og:description</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{og.description || 'None'}</td>
                </tr>
                <tr>
                  <td>og:image</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all' }}>{og.image || 'None'}</td>
                </tr>
                <tr>
                  <td>twitter:card</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{twitter.card || 'None'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
