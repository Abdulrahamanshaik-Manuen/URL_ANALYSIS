import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import BulkAnalyzerTab from '../components/BulkAnalyzerTab';
import HistoryView from '../components/HistoryView';

import Navbar from '../components/Navbar';
import UrlInputBar from '../components/UrlInputBar';
import LiveProgress from '../components/LiveProgress';
import CrawlProgressCard from '../components/CrawlProgressCard';
import SettingsModal from '../components/SettingsModal';
import OverviewTab from '../components/OverviewTab';
import HttpNetworkTab from '../components/HttpNetworkTab';
import ErrorsTab from '../components/ErrorsTab';
import PerformanceTab from '../components/PerformanceTab';
import SecurityTab from '../components/SecurityTab';
import CookiesTab from '../components/CookiesTab';
import SeoTab from '../components/SeoTab';
import RobotsSitemapTab from '../components/RobotsSitemapTab';
import ContentTab from '../components/ContentTab';
import AccessibilityTab from '../components/AccessibilityTab';
import LinksTab from '../components/LinksTab';
import AssetsTab from '../components/AssetsTab';
import ResponsiveTab from '../components/ResponsiveTab';
import TechnologyTab from '../components/TechnologyTab';
import ApiTesterTab from '../components/ApiTesterTab';
import QuickChecksTab from '../components/QuickChecksTab';
import PagesTab from '../components/PagesTab';
import ExportModal from '../components/ExportModal';
import HistoryModal from '../components/HistoryModal';


import {
  checkBackendHealth,
  analyzeWebsite,
  streamAnalyzeWebsite,
  streamCrawlWebsite,
  fetchMongoDBPreferences,
  saveMongoDBPreferences
} from '../Services/apiService';

import {
  Activity,
  Globe,
  AlertOctagon,
  Zap,
  Lock,
  Cookie,
  Search,
  FileCode,
  AlignLeft,
  Eye,
  Link2,
  Image,
  Smartphone,
  Cpu,
  Send,
  Sparkles,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const [activeView, setActiveView] = useState('auditor'); // 'auditor' | 'bulk' | 'history' | 'quick' | 'api-tester' | 'settings'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [backendStatus, setBackendStatus] = useState('checking');

  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [activeSteps, setActiveSteps] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Crawler & System Preferences
  const [scanMode, setScanMode] = useState('crawl');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledPages, setCrawledPages] = useState([]);
  const [crawlState, setCrawlState] = useState({
    discoveredCount: 0,
    crawledCount: 0,
    remainingCount: 0,
    currentUrl: '',
    siteHealthScore: 0
  });

  const [systemConfig, setSystemConfig] = useState({
    timerMinutes: null,
    maxPages: 25,
    concurrency: 3,
    respectRobots: true
  });

  // Advanced Options
  const [options, setOptions] = useState({
    checkDNS: true,
    checkSSL: true,
    checkPerformance: true,
    checkRedirects: true,
    checkSecurity: true,
    checkCookies: true,
    checkSEO: true,
    checkA11y: true,
    checkResources: true,
    checkLinks: true,
    checkContent: true,
    checkMobile: true,
    checkTech: true,
    checkBrowser: true
  });

  const [advanced, setAdvanced] = useState({
    userAgent: '',
    keyword: '',
    timeout: 15000
  });

  // Load preferences from MongoDB Atlas on Mount
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setBackendStatus(res.status);
    });

    fetchMongoDBPreferences().then((prefs) => {
      if (prefs) {
        if (prefs.theme) {
          setTheme(prefs.theme);
          document.documentElement.setAttribute('data-theme', prefs.theme);
        }
        if (prefs.systemConfig) setSystemConfig(prefs.systemConfig);
        if (prefs.options) setOptions(prefs.options);
        if (prefs.advanced) setAdvanced(prefs.advanced);
      }
    });

    const interval = setInterval(() => {
      checkBackendHealth().then((res) => setBackendStatus(res.status));
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Theme Toggler with MongoDB Atlas Sync
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    saveMongoDBPreferences({ theme: nextTheme, systemConfig, options, advanced });
  };

  // Run Single Page Analysis
  const handleAnalyze = () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setIsCrawling(false);
    setErrorMessage(null);
    setCurrentStep('start');
    setActiveSteps(['start']);

    const cleanup = streamAnalyzeWebsite(
      url,
      options,
      advanced,
      (progressEvent) => {
        const step = progressEvent.step;
        setCurrentStep(step);
        setActiveSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));

        if (step === 'partial' && progressEvent.data) {
          setAuditData(progressEvent.data);
        }
      },
      (finalData) => {
        setAuditData(finalData);
        setIsLoading(false);
        setCurrentStep(null);
      },
      (err) => {
        analyzeWebsite(url, options, advanced)
          .then((res) => {
            setAuditData(res);
            setIsLoading(false);
            setCurrentStep(null);
          })
          .catch((postErr) => {
            setErrorMessage(postErr.message || err.message);
            setIsLoading(false);
            setCurrentStep(null);
          });
      }
    );
  };

  // Run Full Website Crawl
  const handleCrawl = () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setIsCrawling(true);
    setErrorMessage(null);
    setCrawledPages([]);
    setCrawlState({
      discoveredCount: 1,
      crawledCount: 0,
      remainingCount: 1,
      currentUrl: url,
      siteHealthScore: 0,
      maxPages: systemConfig.maxPages || 25
    });

    const cleanup = streamCrawlWebsite(
      url,
      systemConfig.maxPages || 25,
      ({ event, data }) => {
        if (event === 'page_done' && data.page) {
          setCrawledPages((prev) => [...prev, data.page]);
          setCrawlState({
            discoveredCount: data.discoveredCount || 1,
            crawledCount: data.crawledCount || 0,
            remainingCount: data.remainingCount || 0,
            currentUrl: data.page.url,
            siteHealthScore: data.siteHealthScore || 0,
            maxPages: systemConfig.maxPages || 25,
            crawlingProgressText: data.crawlingProgressText || `Crawled ${data.crawledCount} pages`
          });

          if (data.page.details && data.page.details.checks) {
            setAuditData(data.page.details);
          }
        } else if (event === 'page_start' && data.currentUrl) {
          setCrawlState((prev) => ({
            ...prev,
            currentUrl: data.currentUrl,
            discoveredCount: data.discoveredCount || prev.discoveredCount,
            crawledCount: data.crawledCount || prev.crawledCount,
            remainingCount: data.remainingCount || prev.remainingCount,
            crawlingProgressText: data.crawlingProgressText || `Crawling ${data.crawledCount + 1} pages`
          }));
        }
      },
      (finalPayload) => {
        setIsLoading(false);
        setIsCrawling(false);
        if (finalPayload.pages && finalPayload.pages.length > 0) {
          setCrawledPages(finalPayload.pages);
          if (finalPayload.pages[0].details) {
            setAuditData(finalPayload.pages[0].details);
          }
        }
        setActiveTab('pages');
      },
      (err) => {
        setIsLoading(false);
        setIsCrawling(false);
        setErrorMessage(err.message || 'Website crawl encountered an error');
      }
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Health', icon: Activity },
    { id: 'http', label: 'HTTP / Status', icon: Globe },
    {
      id: 'pages',
      label: 'Pages & Site Map',
      icon: Compass,
      badge: crawledPages.length > 0 ? crawledPages.length : null,
      badgeType: 'success'
    },
    {
      id: 'errors',
      label: 'Errors & Console',
      icon: AlertOctagon,
      badge: (auditData?.summary?.jsErrorsCount || 0) > 0 ? auditData.summary.jsErrorsCount : null,
      badgeType: 'danger'
    },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'security', label: 'Security & SSL', icon: Lock },
    { id: 'cookies', label: 'Cookies & Privacy', icon: Cookie },
    { id: 'seo', label: 'SEO & Meta', icon: Search },
    { id: 'robots', label: 'Robots & Sitemap', icon: FileCode },
    { id: 'content', label: 'Content & Headings', icon: AlignLeft },
    { id: 'a11y', label: 'Accessibility', icon: Eye, badge: (auditData?.summary?.a11yIssuesCount || 0) > 0 ? auditData.summary.a11yIssuesCount : null, badgeType: 'warning' },
    { id: 'links', label: 'Links Inspector', icon: Link2, badge: (auditData?.summary?.brokenLinksCount || 0) > 0 ? auditData.summary.brokenLinksCount : null, badgeType: 'danger' },
    { id: 'assets', label: 'Images & Assets', icon: Image },
    { id: 'responsive', label: 'Responsive', icon: Smartphone },
    { id: 'tech', label: 'Technology Stack', icon: Cpu },
    { id: 'api', label: 'API Tester', icon: Send },
    { id: 'quick', label: 'Micro-Checks', icon: Sparkles }
  ];

  return (
    <div className="app-layout-wrapper">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'settings') {
            setShowSettingsModal(true);
          } else {
            setActiveView(view);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        {/* Top Navbar */}
        <Navbar
          backendStatus={backendStatus}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenExport={() => setShowExportModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenHistory={() => setActiveView('history')}
          hasData={!!auditData}
        />

        <div style={{ marginTop: '16px' }}>

          {/* VIEW 1: Full Website Auditor */}
          {activeView === 'auditor' && (
            <>
              {/* Hero URL Input Bar */}
              <UrlInputBar
                url={url}
                setUrl={setUrl}
                onAnalyze={handleAnalyze}
                onCrawl={handleCrawl}
                isLoading={isLoading}
                scanMode={scanMode}
                setScanMode={setScanMode}
                options={options}
                setOptions={setOptions}
                advanced={advanced}
                setAdvanced={setAdvanced}
              />

              {/* Crawl Live Progress Widget */}
              {isCrawling && <CrawlProgressCard crawlState={crawlState} />}

              {/* Fixed Real-Time Live Analysis Progress Card */}
              {!isCrawling && (
                <LiveProgress
                  currentStep={currentStep}
                  activeSteps={activeSteps}
                  isLoading={isLoading}
                  hasData={!!auditData}
                />
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div
                  className="card"
                  style={{
                    borderLeft: '4px solid var(--danger)',
                    background: 'var(--danger-bg)',
                    marginBottom: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <AlertCircle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--danger)' }}>Action Failed</strong>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Fixed 18-Domain Navigation Tabs */}
              <div className="tabs-navigation-wrapper">
                <div className="tabs-list">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        className={`tab-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                        {tab.badge !== null && tab.badge !== undefined && (
                          <span className={`tab-badge ${tab.badgeType || ''}`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Tab Content */}
              <main>
                {activeTab === 'overview' && <OverviewTab data={auditData} isLoading={isLoading} />}
                {activeTab === 'http' && <HttpNetworkTab data={auditData} />}
                {activeTab === 'pages' && (
                  <PagesTab
                    pages={crawledPages}
                    siteHealthScore={crawlState.siteHealthScore}
                    onInspectPage={(pageData) => {
                      setAuditData(pageData);
                      setActiveTab('overview');
                    }}
                  />
                )}
                {activeTab === 'errors' && <ErrorsTab data={auditData} />}
                {activeTab === 'performance' && <PerformanceTab data={auditData} />}
                {activeTab === 'security' && <SecurityTab data={auditData} />}
                {activeTab === 'cookies' && <CookiesTab data={auditData} />}
                {activeTab === 'seo' && <SeoTab data={auditData} />}
                {activeTab === 'robots' && <RobotsSitemapTab data={auditData} />}
                {activeTab === 'content' && <ContentTab data={auditData} />}
                {activeTab === 'a11y' && <AccessibilityTab data={auditData} />}
                {activeTab === 'links' && <LinksTab data={auditData} />}
                {activeTab === 'assets' && <AssetsTab data={auditData} />}
                {activeTab === 'responsive' && <ResponsiveTab data={auditData} />}
                {activeTab === 'tech' && <TechnologyTab data={auditData} />}
                {activeTab === 'api' && <ApiTesterTab initialUrl={url} />}
                {activeTab === 'quick' && <QuickChecksTab currentUrl={url} />}
              </main>
            </>
          )}

          {/* VIEW 2: Multi-URL Batch Auditor */}
          {activeView === 'bulk' && (
            <BulkAnalyzerTab
              onLoadReport={(fullDetails, reportDoc) => {
                const auditPayload = fullDetails?.checks ? fullDetails : (fullDetails?.pages?.[0]?.details || fullDetails?.fullDetails || fullDetails);
                setAuditData(auditPayload);
                const pagesList = reportDoc?.pages || fullDetails?.pages || [];
                if (pagesList.length > 0) {
                  setCrawledPages(pagesList);
                }
                const targetUrl = reportDoc?.startUrl || reportDoc?.targetUrl || reportDoc?.url || auditPayload?.targetUrl || auditPayload?.startUrl;
                if (targetUrl) {
                  setUrl(targetUrl);
                }
                setActiveView('auditor');
                setActiveTab('overview');
              }}
            />
          )}

          {/* VIEW 3: Audit History & Sites View */}
          {activeView === 'history' && (
            <HistoryView
              onLoadReport={(fullDetails, reportDoc) => {
                setAuditData(fullDetails);
                if (reportDoc?.targetUrl) setUrl(reportDoc.targetUrl);
                if (reportDoc?.crawledPages && reportDoc.crawledPages.length > 0) {
                  setCrawledPages(reportDoc.crawledPages);
                }
              }}
            />
          )}

          {/* VIEW 4: Micro Checks Suite */}
          {activeView === 'quick' && <QuickChecksTab currentUrl={url} />}

          {/* VIEW 5: API Endpoint Tester */}
          {activeView === 'api-tester' && <ApiTesterTab initialUrl={url} />}
        </div>
      </div>

      {/* Export Report Modal */}
      {showExportModal && auditData && (
        <ExportModal data={auditData} onClose={() => setShowExportModal(false)} />
      )}

      {/* System Settings & Timer Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          config={systemConfig}
          onSaveConfig={(newConfig) => {
            setSystemConfig(newConfig);
            saveMongoDBPreferences({ theme, systemConfig: newConfig, options, advanced });
          }}
        />
      )}

      {/* Saved Reports History Modal (MongoDB Atlas) */}
      {showHistoryModal && (
        <HistoryModal
          onClose={() => setShowHistoryModal(false)}
          onLoadReport={(fullDetails, reportDoc) => {
            setAuditData(fullDetails);
            if (reportDoc?.targetUrl) setUrl(reportDoc.targetUrl);
            if (reportDoc?.crawledPages && reportDoc.crawledPages.length > 0) {
              setCrawledPages(reportDoc.crawledPages);
            }
            setActiveView('auditor');
            setActiveTab('overview');
          }}
        />
      )}
    </div>
  );
}


