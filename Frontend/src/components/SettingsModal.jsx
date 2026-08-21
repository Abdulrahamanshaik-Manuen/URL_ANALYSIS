import React, { useState } from 'react';
import { X, Clock, Compass, Shield, Save, Check } from 'lucide-react';

export default function SettingsModal({ onClose, config, onSaveConfig }) {
  const [timerMinutes, setTimerMinutes] = useState(config?.timerMinutes || '');
  const [maxPages, setMaxPages] = useState(config?.maxPages || 25);
  const [concurrency, setConcurrency] = useState(config?.concurrency || 3);
  const [respectRobots, setRespectRobots] = useState(config?.respectRobots !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveConfig({
      timerMinutes: timerMinutes ? parseInt(timerMinutes, 10) : null,
      maxPages: parseInt(maxPages, 10) || 25,
      concurrency: parseInt(concurrency, 10) || 3,
      respectRobots
    });
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Preferences & System Settings</h3>
          <button className="theme-toggle-btn" onClick={onClose} title="Close Modal" style={{ padding: '8px', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Custom Check Timer Section */}
          <div className="settings-section" style={{
            background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
              <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>Automated Website Check Timer</span>
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Set your own custom interval in minutes to automatically check your target website health. Leave empty to disable background timer.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                className="url-input-field"
                placeholder="Enter custom minutes (e.g. 30, 60, 120)..."
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                min="1"
                style={{ height: '42px', padding: '0 14px', fontSize: '14px' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Minutes</span>
            </div>
          </div>

          {/* Website Crawler Options Section */}
          <div className="settings-section" style={{
            background: 'var(--card-bg-subtle, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
              <Compass size={16} style={{ color: 'var(--accent-blue)' }} />
              <span>Full Website Crawler Limits</span>
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Control recursive same-domain internal page crawl limits and worker concurrency.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Max Pages Limit</span>
                <select
                  value={maxPages}
                  onChange={(e) => setMaxPages(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '6px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0 12px'
                  }}
                >
                  <option value={10}>10 Pages (Fast)</option>
                  <option value={25}>25 Pages (Standard)</option>
                  <option value={50}>50 Pages (Deep Audit)</option>
                  <option value={100}>100 Pages (Full Site)</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Parallel Workers</span>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '6px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0 12px'
                  }}
                >
                  <option value={1}>1 Worker (Gentle)</option>
                  <option value={3}>3 Workers (Balanced)</option>
                  <option value={5}>5 Workers (High Speed)</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={respectRobots}
                onChange={(e) => setRespectRobots(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }}
              />
              <span>Respect Robots.txt directives & sitemap.xml seeds</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ height: '40px', padding: '0 20px' }}>
              {savedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
