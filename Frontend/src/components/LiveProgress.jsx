import React from 'react';
import { Loader2, CheckCircle2, Shield, Search, Globe, Gauge, Cpu, ExternalLink } from 'lucide-react';

export default function LiveProgress({ currentStep, activeSteps = [] }) {
  const allPhases = [
    { id: 'start', label: 'Connecting' },
    { id: 'dns', label: 'DNS & SSL' },
    { id: 'performance', label: 'HTTP Network Fetch' },
    { id: 'security', label: 'Security & Headers' },
    { id: 'accessibility', label: 'Accessibility Audit' },
    { id: 'seo', label: 'SEO & Robots' },
    { id: 'links', label: 'Link Validation' },
    { id: 'resources', label: 'Assets & Media' },
    { id: 'technology', label: 'Tech Detection' },
    { id: 'browser', label: 'Playwright Browser Audit' }
  ];

  return (
    <div className="live-progress-card">
      <div className="progress-header">
        <div className="progress-title">
          <Loader2 size={20} className="spinner-icon" />
          <span>Real-Time Live Analysis in Progress...</span>
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {currentStep ? `Active Phase: ${currentStep.toUpperCase()}` : 'Initializing...'}
        </span>
      </div>

      <div className="steps-timeline">
        {allPhases.map((phase) => {
          const isDone = activeSteps.includes(phase.id);
          const isActive = currentStep === phase.id || (currentStep === 'browser_starting' && phase.id === 'browser');

          return (
            <div
              key={phase.id}
              className={`step-chip ${isDone ? 'done' : isActive ? 'active' : ''}`}
            >
              {isDone ? (
                <CheckCircle2 size={14} />
              ) : isActive ? (
                <Loader2 size={14} className="spinner-icon" />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
              )}
              <span>{phase.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
