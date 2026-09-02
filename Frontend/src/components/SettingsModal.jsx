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
