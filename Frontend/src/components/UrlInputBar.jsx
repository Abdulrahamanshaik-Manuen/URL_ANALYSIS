import React from 'react';
import { Globe, X, Loader2, Compass } from 'lucide-react';

export default function UrlInputBar({
  url,
  setUrl,
  onAnalyze,
  onCrawl,
  isLoading
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    // Trigger full multi-page website crawler & audit
    if (onCrawl) {
      onCrawl();
    } else if (onAnalyze) {
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
            placeholder="Enter Url to crawl"
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

        <button type="submit" className="btn-primary" disabled={isLoading || !url.trim()} style={{ minWidth: '170px' }}>
          {isLoading ? (
            <>
              <Loader2 size={18} className="spinner-icon" />
              <span>Crawling Pages...</span>
            </>
          ) : (
            <>
              <Compass size={18} />
              <span>Crawl</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
