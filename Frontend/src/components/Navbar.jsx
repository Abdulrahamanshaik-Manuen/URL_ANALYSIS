import React from 'react';
import { Globe, Sun, Moon, Download, Database } from 'lucide-react';

export default function Navbar({ backendStatus, theme, onToggleTheme, onOpenExport, onOpenSettings, onOpenHistory, hasData }) {
  return (
    <header className="navbar">
      <div className="brand-group">
        <div className="brand-icon-wrapper">
          <Globe size={24} />
        </div>
        <div>
          <h1 className="brand-title">URL Analysis</h1>
        </div>
      </div>

      <div className="nav-actions">
        <button className="export-btn" onClick={onOpenHistory} title="View Saved MongoDB Reports">
          <Database size={15} />
          <span>Saved Reports</span>
        </button>

        {hasData && (
          <button className="export-btn" onClick={onOpenExport} title="Export Analysis Report">
            <Download size={15} />
            <span>Export Report</span>
          </button>
        )}

        <button className="theme-toggle-btn" onClick={onToggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
