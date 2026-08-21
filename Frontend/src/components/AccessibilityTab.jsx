import React from 'react';
import { Eye, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export default function AccessibilityTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const a11y = checks.accessibility || {};
  const issues = a11y.issues || [];
  const passed = a11y.passed || [];
  const stats = a11y.stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Score Banner */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Eye size={18} style={{ color: a11y.score >= 80 ? 'var(--success)' : 'var(--warning)' }} />
            <span>Accessibility (a11y) Health Audit</span>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: a11y.score >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: a11y.score >= 80 ? 'var(--success)' : 'var(--warning)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            Score: {a11y.score || 0} / 100 ({a11y.rating || 'N/A'})
          </span>
        </div>

        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div className="stat-box">
            <div className="stat-box-label">Total Images</div>
            <div className="stat-box-value">{stats.totalImages || 0}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Images Missing Alt</div>
            <div className="stat-box-value" style={{ color: stats.missingAltCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {stats.missingAltCount || 0}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Unlabeled Form Inputs</div>
            <div className="stat-box-value" style={{ color: stats.unlabeledInputCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {stats.unlabeledInputCount || 0}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Empty Buttons</div>
            <div className="stat-box-value" style={{ color: stats.emptyButtonCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {stats.emptyButtonCount || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Issues List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <span>Accessibility Violations & Remediations ({issues.length})</span>
          </div>
        </div>

        {issues.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {issues.map((iss, i) => (
              <div
                key={i}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  background: iss.severity === 'high' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                  border: `1px solid ${iss.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: iss.severity === 'high' ? 'var(--danger)' : 'var(--warning)',
                      color: iss.severity === 'high' ? '#fff' : '#000',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {iss.severity}
                  </span>
                  <strong style={{ fontSize: '14px' }}>{iss.title}</strong>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{iss.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--success)', fontSize: '13px' }}>
            Zero accessibility violations found! All images have alt tags and forms are properly labeled.
          </p>
        )}
      </div>

      {/* Passed Checks */}
      {passed.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <span>Passed Accessibility Checks</span>
            </div>
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {passed.map((p, i) => (
              <li key={i} style={{ marginBottom: '6px' }}>{p.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
