import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Compass,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Lock,
  Zap,
  Shield,
  Eye,
  Smartphone,
  Cookie,
  Cpu,
  Filter
} from 'lucide-react';
import { fetchAuditHistory, fetchReportById, deleteAuditReport } from '../Services/apiService';

export default function HistoryView({ onLoadReport }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [loadingReportId, setLoadingReportId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await fetchAuditHistory();
    setReports(data || []);
    setIsLoading(false);
  };

  const handleSelectReport = async (reportId) => {
    try {
      setLoadingReportId(reportId);
      const fullReport = await fetchReportById(reportId);
      if (fullReport && fullReport.fullDetails) {
        onLoadReport(fullReport.fullDetails, fullReport);
      } else {
        alert('Full audit details could not be loaded.');
      }
    } catch (err) {
      alert(`Failed to load audit report: ${err.message}`);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDelete = async (e, reportId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Full Website Audit record from MongoDB Atlas?')) return;

    try {
      setDeletingId(reportId);
      await deleteAuditReport(reportId);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const checkMatrix = [
    { key: 'http', label: 'HTTP / Uptime', icon: Globe },
    { key: 'ssl', label: 'SSL Certificate', icon: Lock },
    { key: 'performance', label: 'Performance / Speed', icon: Zap },
    { key: 'security', label: 'Security & Headers', icon: Shield },
    { key: 'seo', label: 'SEO & Meta', icon: Search },
    { key: 'accessibility', label: 'Accessibility', icon: Eye },
    { key: 'mobile', label: 'Mobile Friendly', icon: Smartphone },
    { key: 'cookies', label: 'Cookies & Privacy', icon: Cookie },
    { key: 'technology', label: 'Tech Stack', icon: Cpu }
  ];

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      (r.targetUrl || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.rating || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (ratingFilter === 'EXCELLENT') return (r.overallScore || 0) >= 80;
    if (ratingFilter === 'GOOD') return (r.overallScore || 0) >= 50 && (r.overallScore || 0) < 80;
    if (ratingFilter === 'POOR') return (r.overallScore || 0) < 50;

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              <Database size={16} /> Dynamic MongoDB Atlas Records
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Audit History & Tracked Sites
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px' }}>
              Browse all historical Full Website Audits dynamically fetched from MongoDB Atlas. View site scores, pages scanned, and full check matrices.
            </p>
          </div>

          <button
            onClick={loadHistory}
            disabled={isLoading}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh MongoDB
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by URL or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Filter:
          </span>
          {['ALL', 'EXCELLENT', 'GOOD', 'POOR'].map((f) => (
            <button
              key={f}
              onClick={() => setRatingFilter(f)}
              className={ratingFilter === f ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '11px', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto' }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '12px' }}>
            Fetching Full Website Audits from MongoDB Atlas...
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Compass size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No Audit Reports Found</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {searchTerm || ratingFilter !== 'ALL'
              ? 'No historical reports matched your search filters.'
              : 'Run your first Full Website Audit using the Inspector or Multi-URL Batch Auditor to save records to MongoDB.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReports.map((report) => {
            const score = report.overallScore || 0;
            const isSelected = loadingReportId === report._id;

            return (
              <div
                key={report._id}
                onClick={() => handleSelectReport(report._id)}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  cursor: 'pointer',
                  padding: '16px 20px'
                }}
              >
                {/* Left Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '14px',
                      color: '#ffffff',
                      background: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {score}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {report.targetUrl}
                      </h4>
                      <span className="status-badge">
                        {report.rating || 'Audit'}
                      </span>
                      <span className="status-badge" style={{ background: 'var(--info-bg)', color: 'var(--info)', borderColor: 'var(--info)' }}>
                        {report.pagesScanned || 1} Pages Scanned
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Matrix */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {checkMatrix.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.key}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <Icon size={10} style={{ color: 'var(--success)' }} />
                            <span>{item.label.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectReport(report._id);
                    }}
                    disabled={isSelected}
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '6px 14px' }}
                  >
                    {isSelected ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />} Inspect Report
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, report._id)}
                    disabled={deletingId === report._id}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--danger)' }}
                    title="Delete Report from MongoDB"
                  >
                    {deletingId === report._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
