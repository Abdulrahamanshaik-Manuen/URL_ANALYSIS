import React from 'react';
import { Smartphone, Tablet, Monitor, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function ResponsiveTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const mob = checks.mobile || {};
  const browser = checks.browser || {};
  const viewports = browser.viewports || {
    desktop: { overflow: false },
    tablet: { overflow: false },
    mobile: { overflow: false }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Smartphone size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Mobile-Friendliness & Viewport Compliance</span>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: mob.isMobileFriendly ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: mob.isMobileFriendly ? 'var(--success)' : 'var(--warning)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            {mob.isMobileFriendly ? 'Mobile Friendly' : 'Needs Optimization'}
          </span>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Viewport Meta Tag</div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>
              {mob.viewportMeta?.present ? 'Present' : 'Missing'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {mob.viewportMeta?.content || 'No viewport tag'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Width Device-Width</div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>
              {mob.viewportMeta?.hasWidthDeviceWidth ? 'Configured' : 'Not Set'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Touch Icons Defined</div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>
              {mob.responsiveIndicators?.touchIcons ? 'Apple Touch Icon Present' : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Viewport Horizontal Overflow Check (Headless Browser) */}
      <div className="dashboard-grid">
        {/* Desktop (1920x1080) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Monitor size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Desktop (1920x1080)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!viewports.desktop?.overflow ? (
              <>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  No horizontal overflow. Layout fits cleanly.
                </span>
              </>
            ) : (
              <>
                <XCircle size={20} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
                  Horizontal scroll detected! Content overflows width.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tablet (768x1024) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Tablet size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>Tablet (768x1024)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!viewports.tablet?.overflow ? (
              <>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  No horizontal overflow. Responsive layout.
                </span>
              </>
            ) : (
              <>
                <XCircle size={20} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
                  Tablet horizontal overflow detected!
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mobile (390x844) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Smartphone size={18} style={{ color: 'var(--accent-indigo)' }} />
              <span>Mobile (390x844 iPhone)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!viewports.mobile?.overflow ? (
              <>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Mobile layout fits perfectly without clipping.
                </span>
              </>
            ) : (
              <>
                <XCircle size={20} style={{ color: 'var(--danger)' }} />
                <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
                  Mobile layout has horizontal overflow!
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
