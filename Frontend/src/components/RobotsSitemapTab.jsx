import React from 'react';
import { FileCode, ListOrdered, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export default function RobotsSitemapTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const seo = checks.seo || {};
  const robots = seo.robotsTxt || {};
  const sitemap = seo.sitemap || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="dashboard-grid">
        {/* Robots.txt Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FileCode size={18} style={{ color: robots.found ? 'var(--success)' : 'var(--warning)' }} />
              <span>robots.txt Crawlability</span>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: robots.found ? 'var(--success-bg)' : 'var(--warning-bg)',
                color: robots.found ? 'var(--success)' : 'var(--warning)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {robots.found ? 'Found & Active' : 'Not Found'}
            </span>
          </div>

          {robots.found ? (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Disallows defined: <strong>{robots.disallowCount || 0}</strong> rules. Sitemaps linked in robots: <strong>{robots.sitemapsFound?.length || 0}</strong>.
              </p>
              {robots.rawPreview && (
                <pre className="code-block" style={{ maxHeight: '200px' }}>
                  {robots.rawPreview}
                </pre>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              No accessible robots.txt file was found at root origin ({robots.url}). Consider creating one to guide search engine crawlers.
            </p>
          )}
        </div>

        {/* Sitemap.xml Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ListOrdered size={18} style={{ color: sitemap.found ? 'var(--success)' : 'var(--warning)' }} />
              <span>sitemap.xml Discovery</span>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: sitemap.found ? 'var(--success-bg)' : 'var(--warning-bg)',
                color: sitemap.found ? 'var(--success)' : 'var(--warning)',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {sitemap.found ? `${sitemap.urlCount || 0} URLs Indexed` : 'Not Found'}
            </span>
          </div>

          {sitemap.found ? (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Valid XML sitemap detected with <strong>{sitemap.urlCount || 0}</strong> indexed destination URLs.
              </p>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                {sitemap.url}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              No sitemap.xml detected at root origin ({sitemap.url}). Submitting an XML sitemap to search engines improves page discovery.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
