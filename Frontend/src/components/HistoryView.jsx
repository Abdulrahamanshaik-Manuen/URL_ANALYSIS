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
  Filter,
  ArrowLeft,
  Layers,
  AlertTriangle,
  FileCode
} from 'lucide-react';
import { fetchAuditHistory, fetchReportById, deleteAuditReport } from '../Services/apiService';
import OverviewTab from './OverviewTab';
import HttpNetworkTab from './HttpNetworkTab';
import PagesTab from './PagesTab';
import ErrorsTab from './ErrorsTab';
import PerformanceTab from './PerformanceTab';
import SecurityTab from './SecurityTab';
import CookiesTab from './CookiesTab';
import SeoTab from './SeoTab';
import RobotsSitemapTab from './RobotsSitemapTab';
import ContentTab from './ContentTab';
import AccessibilityTab from './AccessibilityTab';
import LinksTab from './LinksTab';
import AssetsTab from './AssetsTab';
import ResponsiveTab from './ResponsiveTab';
import TechnologyTab from './TechnologyTab';

export default function HistoryView({ onLoadReport }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [loadingReportId, setLoadingReportId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Inline inspect report state (staying on same page)
  const [inspectingReport, setInspectingReport] = useState(null);
  const [inspectTab, setInspectTab] = useState('overview');

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
      const details = fullReport?.fullDetails || fullReport?.crawledPages?.[0]?.details || (fullReport?.checks ? fullReport : fullReport);
      if (fullReport && details) {
        setInspectingReport({ details, reportDoc: fullReport });
        setInspectTab('overview');
        if (typeof onLoadReport === 'function') {
          onLoadReport(details, fullReport);
        }
      }
    } catch (err) {
      console.error('Failed to load audit report:', err);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDelete = async (e, reportId) => {
    if (e) e.stopPropagation();

    try {
      setDeletingId(reportId);
      await deleteAuditReport(reportId);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      if (inspectingReport?.reportDoc?._id === reportId) {
        setInspectingReport(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
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

  // If a report is selected for inline inspection, render full report inspection view on SAME page
  if (inspectingReport) {
    const { details, reportDoc } = inspectingReport;
    const score = details?.scores?.overall || reportDoc?.overallScore || 0;
    const targetUrl = details?.url || reportDoc?.targetUrl || 'Audited Website';
    const crawledPages = reportDoc?.crawledPages || details?.crawledPages || [];

    const inspectTabs = [
      { id: 'overview', label: 'Overview', icon: Activity },
      ...(crawledPages.length > 0 ? [{ id: 'pages', label: 'Crawled Pages', icon: Layers, badge: crawledPages.length }] : []),
      { id: 'http', label: 'HTTP & Network', icon: Globe },
      { id: 'performance', label: 'Performance', icon: Zap },
      { id: 'security', label: 'Security & Headers', icon: Shield },
      { id: 'seo', label: 'SEO & Meta', icon: Search },
      { id: 'a11y', label: 'Accessibility', icon: Eye },
      { id: 'tech', label: 'Tech Stack', icon: Cpu },
      { id: 'responsive', label: 'Responsive', icon: Smartphone },
      { id: 'errors', label: 'Errors & Console', icon: AlertTriangle },
      { id: 'links', label: 'Links', icon: Compass },
      { id: 'cookies', label: 'Cookies', icon: Cookie }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Inspection Header Bar */}
        <div className="card inspection-header-card">
          <div className="inspection-header-left">
            <button
              onClick={() => setInspectingReport(null)}
              className="btn-secondary back-history-btn"
            >
              <ArrowLeft size={16} />
              <span>Back to History List</span>
            </button>

            <div className="inspection-title-group">
              <div className="inspection-title-row">
                <h3 className="inspection-target-url">
                  {targetUrl}
                </h3>
                <span
                  className="status-badge"
                  style={{
                    background: score >= 80 ? 'var(--success-bg)' : score >= 50 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                    color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Score: {score}/100 ({reportDoc?.rating || 'Audit'})
                </span>
              </div>
              <p className="inspection-meta-text">
                Audited: {new Date(reportDoc?.createdAt || Date.now()).toLocaleString()} • {reportDoc?.pagesScanned || 1} Pages Scanned
              </p>
            </div>
          </div>

          <div className="inspection-header-actions">
            <button
              onClick={(e) => handleDelete(e, reportDoc._id)}
              className="btn-secondary"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '12px', padding: '6px 12px' }}
            >
              <Trash2 size={14} />
              <span>Delete Record</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation for Inline Inspector */}
        <div className="tabs-navigation-wrapper">
          <div className="tabs-list">
            {inspectTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = inspectTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setInspectTab(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="tab-badge info">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline Inspection Tab Content */}
        <main>
          {inspectTab === 'overview' && <OverviewTab data={details} isLoading={false} />}
          {inspectTab === 'http' && <HttpNetworkTab data={details} />}
          {inspectTab === 'pages' && (
            <PagesTab
              pages={crawledPages}
              siteHealthScore={score}
              onInspectPage={(pageData) => {
                setInspectingReport({ details: pageData, reportDoc });
                setInspectTab('overview');
              }}
            />
          )}
          {inspectTab === 'errors' && <ErrorsTab data={details} />}
          {inspectTab === 'performance' && <PerformanceTab data={details} />}
          {inspectTab === 'security' && <SecurityTab data={details} />}
          {inspectTab === 'cookies' && <CookiesTab data={details} />}
          {inspectTab === 'seo' && <SeoTab data={details} />}
          {inspectTab === 'a11y' && <AccessibilityTab data={details} />}
          {inspectTab === 'links' && <LinksTab data={details} />}
          {inspectTab === 'responsive' && <ResponsiveTab data={details} />}
          {inspectTab === 'tech' && <TechnologyTab data={details} />}
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search & Filter Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search audit history by target URL or rating..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Scores</option>
              <option value="EXCELLENT">Excellent (80+)</option>
              <option value="GOOD">Good (50 - 79)</option>
              <option value="POOR">Poor (&lt; 50)</option>
            </select>
          </div>

          <button onClick={loadHistory} className="btn-secondary" title="Refresh Audit History">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* History Records List */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)', margin: '0 auto' }} />
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
                className="card history-item-card"
              >
                {/* Left Info */}
                <div className="history-card-left">
                  <div
                    className="history-score-badge"
                    style={{
                      background: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)',
                    }}
                  >
                    {score}
                  </div>

                  <div className="history-card-details">
                    <div className="history-url-row">
                      <h4 className="history-card-url">
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
                <div className="history-card-actions">
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
                    style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--danger)', borderColor: 'var(--border-color)' }}
                    title="Delete record from MongoDB Atlas"
                  >
                    {deletingId === report._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
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


