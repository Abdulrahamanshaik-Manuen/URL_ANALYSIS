import React, { useState } from 'react';
import { Download, FileText, Copy, Check, Printer, X } from 'lucide-react';

export default function ExportModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const jsonString = JSON.stringify(data, null, 2);

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>

        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
          Export Website Audit Report
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Target: {data.targetUrl} • Overall Score: {data.scores?.overall}/100 ({data.scores?.rating})
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button className="btn-primary" onClick={handleDownloadJson} style={{ height: '42px', padding: '0 18px', fontSize: '13px' }}>
            <Download size={16} />
            <span>Download JSON Report</span>
          </button>
          <button className="btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
          </button>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Report (PDF)</span>
          </button>
        </div>

        <pre className="code-block" style={{ maxHeight: '350px' }}>
          {jsonString}
        </pre>
      </div>
    </div>
  );
}
