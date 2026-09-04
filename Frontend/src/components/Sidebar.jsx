import React from 'react';
import {
  Globe,
  Layers,
  History,
  Settings,
  Zap,
  ShieldCheck,
  Activity,
  Sparkles,
  Radio
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  backendStatus = 'online',
  historyCount = 0
}) {
  const navItems = [
    {
      id: 'auditor',
      label: 'Crawl Website',
      icon: Globe,
      badge: null
    },
    {
      id: 'live-tracking',
      label: 'Live Tracking',
      icon: Radio,
      badge: 'LIVE'
    },
    {
      id: 'bulk',
      label: 'Track URLs',
      icon: Layers,
      badge: null
    },
    {
      id: 'history',
      label: 'Audit History & Sites',
      icon: History,
      badge: null
    },
    {
      id: 'quick',
      label: 'Micro Checks Suite',
      icon: Zap,
      badge: null
    },
    {
      id: 'settings',
      label: 'Audit Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className={`left-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Right Edge Click Handle to Toggle Minimize / Expand (No Arrow Button) */}
      <div
        className="sidebar-edge-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Click right edge to Expand Sidebar' : 'Click right edge to Minimize Sidebar'}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '100%',
          cursor: 'pointer',
          zIndex: 100
        }}
      />

      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="sidebar-brand-group">
          <div className="sidebar-logo-icon">
            <ShieldCheck size={22} />
          </div>
          {!isCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">URL INSPECTOR</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="sidebar-menu-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <div className="sidebar-item-icon">
                <Icon size={20} />
              </div>

              {!isCollapsed && (
                <div className="sidebar-item-content">
                  <span className="sidebar-item-title">{item.label}</span>
                  <span className="sidebar-item-desc">{item.description}</span>
                </div>
              )}

            </button>
          );
        })}
      </div>
    </aside>
  );
}

