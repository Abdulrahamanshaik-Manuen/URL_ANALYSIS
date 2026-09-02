import React from 'react';
import {
  Globe,
  Layers,
  History,
  Settings,
  Zap,
  Send,
  ShieldCheck,
  Activity,
  Sparkles
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
      label: 'Full Website Auditor',
      description: 'Single URL deep site audit & crawler',
      icon: Globe,
      badge: null
    },
    {
      id: 'bulk',
      label: 'Multi-URL Batch Auditor',
      description: 'Audit & track multiple URLs at once',
      icon: Layers,
      badge: 'Batch'
    },
    {
      id: 'history',
      label: 'Audit History & Sites',
      description: 'Tracked URLs & check matrix history',
      icon: History,
      badge: historyCount > 0 ? historyCount : null
    },
    {
      id: 'quick',
      label: 'Micro Checks Suite',
      description: 'Instant DNS, SSL, security checks',
      icon: Zap,
      badge: 'Instant'
    },
    {
      id: 'api-tester',
      label: 'API Endpoint Tester',
      description: 'REST API response & schema auditor',
      icon: Send,
      badge: null
    },
    {
      id: 'settings',
      label: 'Audit Settings',
      description: 'Inspect options & user preferences',
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

              {!isCollapsed && item.badge && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

