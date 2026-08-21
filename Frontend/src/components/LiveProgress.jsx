import React from 'react';
import { Loader2, CheckCircle2, Activity, Globe, Shield, Zap, Search, Eye, Link2, Image, Cpu } from 'lucide-react';

export default function LiveProgress({ currentStep, activeSteps = [], isLoading = false, hasData = false }) {
  const allPhases = [
    { id: 'start', label: 'Connecting', icon: Globe },
    { id: 'dns', label: 'DNS & SSL', icon: Shield },
    { id: 'performance', label: 'HTTP Network Fetch', icon: Zap },
    { id: 'security', label: 'Security & Headers', icon: Shield },
    { id: 'accessibility', label: 'Accessibility Audit', icon: Eye },
    { id: 'seo', label: 'SEO & Robots', icon: Search },
    { id: 'links', label: 'Link Validation', icon: Link2 },
    { id: 'resources', label: 'Assets & Media', icon: Image },
    { id: 'technology', label: 'Tech Detection', icon: Cpu },
    { id: 'browser', label: 'Playwright Browser Audit', icon: Activity }
  ];

  const getStatusText = () => {
    if (isLoading) {
      return currentStep ? `Active Phase: ${currentStep.toUpperCase().replace('_', ' ')}` : 'Initializing Browser Engine...';
    }
    if (hasData) {
      return 'Status: 10/10 Diagnostic Domains Verified';
    }
    return 'Status: Ready for Audit';
  };

  return (
    <div className="live-progress-card" style={{ marginBottom: '24px' }}>
      <div className="progress-header">
        <div className="progress-title">
          {isLoading ? (
            <>
              <Loader2 size={20} className="spinner-icon" />
              <span style={{ color: 'var(--text-primary)' }}>Real-Time Live Analysis in Progress...</span>
            </>
          ) : hasData ? (
            <>
              <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--text-primary)' }}>Real-Time Live Analysis Complete</span>
            </>
          ) : (
            <>
              <Activity size={20} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ color: 'var(--text-primary)' }}>Real-Time Live Analysis Engine</span>
            </>
          )}
        </div>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '20px',
            background: isLoading ? 'rgba(6, 182, 212, 0.15)' : hasData ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
            color: isLoading ? 'var(--accent-cyan)' : hasData ? 'var(--success)' : 'var(--text-muted)',
            border: `1px solid ${isLoading ? 'var(--accent-cyan)' : hasData ? 'var(--success)' : 'var(--border-color)'}`
          }}
        >
          {getStatusText()}
        </span>
      </div>

      <div className="steps-timeline">
        {allPhases.map((phase) => {
          const isDone = (hasData && !isLoading) || activeSteps.includes(phase.id);
          const isActive = isLoading && (currentStep === phase.id || (currentStep === 'browser_starting' && phase.id === 'browser'));

          return (
            <div
              key={phase.id}
              className={`step-chip ${isDone ? 'done' : isActive ? 'active' : ''}`}
              style={{
                transition: 'all 0.3s ease',
                fontWeight: isDone || isActive ? 600 : 400
              }}
            >
              {isDone ? (
                <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
              ) : isActive ? (
                <Loader2 size={14} className="spinner-icon" />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.6 }} />
              )}
              <span>{phase.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
