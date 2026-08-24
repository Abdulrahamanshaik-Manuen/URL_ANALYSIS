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
  X
} from 'lucide-react';
import { fetchAuditHistory, fetchReportById, deleteAuditReport } from '../Services/apiService';

export default function HistoryModal({ onClose, onLoadReport }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingReportId, setLoadingReportId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await fetchAuditHistory();
    setReports(data);
    setIsLoading(false);
  };

  const handleSelectReport = async (reportId) => {
    try {
      setLoadingReportId(reportId);
      const fullReport = await fetchReportById(reportId);
      if (fullReport && fullReport.fullDetails) {
        onLoadReport(fullReport.fullDetails, fullReport);
        onClose();
      } else {
        alert('Report details could not be parsed.');
      }
    } catch (err) {
      alert(`Failed to load report: ${err.message}`);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDelete = async (e, reportId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved audit report from MongoDB Atlas?')) return;

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

  const filteredReports = reports.filter((r) =>
    (r.targetUrl || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '820px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              MongoDB Atlas Saved Audit Reports
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              All target website scans and site crawls stored permanently online
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search saved target URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px',
              gap: '12px',
              color: 'var(--accent-cyan)'
            }}
          >
            <Loader2 size={32} className="spinner-icon" />
            <span style={{ fontSize: '13px' }}>Fetching records from MongoDB Atlas...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: 'var(--text-muted)',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Database size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
            <p style={{ fontSize: '14px', margin: 0 }}>
              {searchTerm ? 'No saved reports match your search query.' : 'No audit reports stored in MongoDB Atlas yet.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '440px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}
          >
            {filteredReports.map((item) => {
              const isCrawl = item.scanType === 'crawl';
              const overall = item.overallScore || 0;
              const isSelectedLoading = loadingReportId === item._id;
              const isDeleting = deletingId === item._id;

              const getScoreColor = (val) => {
                if (val >= 90) return 'var(--success)';
                if (val >= 75) return 'var(--info)';
                if (val >= 50) return 'var(--warning)';
                return 'var(--danger)';
              };

              return (
                <div
                  key={item._id}
                  onClick={() => handleSelectReport(item._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    gap: '16px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    {/* Cloudinary CDN Thumbnail Preview */}
                    {item.screenshotUrl ? (
                      <div
                        style={{
                          width: '56px',
                          height: '38px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#000',
                          flexShrink: 0,
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <img
                          src={item.screenshotUrl}
                          alt="Thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '56px',
                          height: '38px',
                          borderRadius: '6px',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          flexShrink: 0
                        }}
                      >
                        {isCrawl ? <Compass size={18} /> : <Activity size={18} />}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.targetUrl}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: isCrawl ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: isCrawl ? 'var(--accent-purple)' : 'var(--accent-primary)',
                            border: `1px solid ${isCrawl ? 'var(--accent-purple)' : 'var(--accent-primary)'}`
                          }}
                        >
                          {isCrawl ? 'Full Site Crawl' : 'Single Audit'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {isCrawl && (
                          <span>
                            Crawled: <strong>{item.pagesScanned || item.crawledPages?.length || 1}</strong> pages (Discovered: {item.pagesDiscovered || 1})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: getScoreColor(overall) }}>
                        {overall} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.rating || 'Score'}</div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(e, item._id)}
                      disabled={isDeleting}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        transition: 'color 0.2s, background 0.2s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      title="Delete Report from MongoDB"
                    >
                      {isDeleting ? <Loader2 size={16} className="spinner-icon" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
