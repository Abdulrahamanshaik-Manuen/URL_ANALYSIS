import React from 'react';
import { Globe, X, Loader2, Compass, Layers } from 'lucide-react';

export default function UrlInputBar({
  url,
  setUrl,
  onAnalyze,
  onCrawl,
  isLoading,
  scanMode = 'single',
  setScanMode
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    if (scanMode === 'crawl' && onCrawl) {
      onCrawl();
    } else {
      onAnalyze();
    }
  };

  return (
    <div className="inspector-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <form onSubmit={handleSubmit} className="inspector-form">
        <div className="url-input-wrapper">
          <Globe size={20} className="url-icon" />
          <input
            type="text"
            className="url-input-field"
            placeholder={scanMode === 'crawl' ? 'Enter starting URL to crawl entire website...' : 'Enter website URL to inspect (e.g. https://example.com)...'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          {url && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setUrl('')}
              disabled={isLoading}
              title="Clear input"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={isLoading || !url.trim()} style={{ minWidth: '160px' }}>
          {isLoading ? (
            <>
              <Loader2 size={18} className="spinner-icon" />
              <span>{scanMode === 'crawl' ? 'Crawling Site...' : 'Auditing...'}</span>
            </>
          ) : scanMode === 'crawl' ? (
            <>
              <Compass size={18} />
              <span>Crawl Website</span>
            </>
          ) : (
            <span>Inspect Website</span>
          )}
        </button>
      </form>

      {/* Mode Selector Pill Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn-secondary ${scanMode === 'single' ? 'active' : ''}`}
            onClick={() => setScanMode && setScanMode('single')}
            disabled={isLoading}
            style={{ height: '32px', fontSize: '12px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Globe size={13} />
            <span>Single Page Audit</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${scanMode === 'crawl' ? 'active' : ''}`}
            onClick={() => setScanMode && setScanMode('crawl')}
            disabled={isLoading}
            style={{ height: '32px', fontSize: '12px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Compass size={13} />
            <span>Full Website Crawler</span>
          </button>
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {scanMode === 'crawl' ? 'Recursively audits same-domain pages, sitemaps & links' : 'Audits 18 security, SEO & performance domains'}
        </span>
      </div>
    </div>
  );
}
