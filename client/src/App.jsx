import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, API_BASE } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import PublicStats from './pages/PublicStats';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected Route Component to restrict dashboard access
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Layout Wrapper with global navbar and theme toggle
const PublicLayout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isAuthPage = ['/login', '/signup', '/verify-otp', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="app-container">
      {/* Header Navigation Bar - hidden on clean centered auth forms, shown on landing */}
      {!isAuthPage ? (
        <nav className="navbar">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="brand-logo" style={{ cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>SnapLink</span>
            </div>
          </Link>

          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }} className="nav-link-hover">
              Login
            </Link>
            <Link to="/signup" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              Get Started
            </Link>
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      ) : (
        /* Floating top-right theme toggle for Auth pages to prevent duplication */
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 70px)' }}>
        {children}
      </div>
    </div>
  );
};

// Authenticated Dashboard Layout Shell
const DashboardShell = ({
  urls,
  urlsLoading,
  setUrls,
  fetchUrls,
  sidebarCollapsed,
  setSidebarCollapsed,
  profileDropdownOpen,
  setProfileDropdownOpen,
  searchQuery,
  setSearchQuery,
  activeSection,
  currentView,
  setCurrentView,
  navigateToSection
}) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`app-container authenticated ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left collapsable Sidebar */}
      <aside className="sidebar">
        {/* Sidebar Header & Toggle */}
        <div className="sidebar-header">
          <div className="brand-logo" onClick={() => navigateToSection('overview')} style={{ cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {!sidebarCollapsed && <span>SnapLink</span>}
          </div>

          <button 
            className="sidebar-collapse-btn" 
            onClick={() => setSidebarCollapsed(prev => !prev)} 
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-btn ${currentView === 'dashboard' && activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => navigateToSection('overview')}
            title="Overview"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            {!sidebarCollapsed && <span>Overview</span>}
          </button>
          
          <button 
            className={`sidebar-nav-btn ${currentView === 'dashboard' && activeSection === 'shorten' ? 'active' : ''}`}
            onClick={() => navigateToSection('shorten')}
            title="Shorten URL"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>Shorten URL</span>}
          </button>
          
          <button 
            className={`sidebar-nav-btn ${currentView === 'dashboard' && activeSection === 'my-urls' ? 'active' : ''}`}
            onClick={() => navigateToSection('my-urls')}
            title="My URLs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {!sidebarCollapsed && <span>My URLs</span>}
          </button>
          
          <button 
            className={`sidebar-nav-btn ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setSearchQuery('');
              setCurrentView('analytics');
            }}
            title="Analytics"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            {!sidebarCollapsed && <span>Analytics</span>}
          </button>

          <button 
            className={`sidebar-nav-btn ${currentView === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setSearchQuery('');
              setCurrentView('profile');
            }}
            title="Account Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* Sidebar Footer - Logout pinned */}
        <div className="sidebar-footer">
          <button className="sidebar-nav-btn logout-nav-btn" onClick={logout} title="Logout" style={{ color: 'var(--error)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="main-content-layout">
        <header className="top-navbar">
          {/* Top Navbar branding */}
          <div className="navbar-brand-wrapper" onClick={() => navigateToSection('overview')} style={{ cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>SnapLink</span>
          </div>

          {/* Search Input widget */}
          <div className="navbar-search-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              className="navbar-search-input" 
              placeholder="Search links, destinations, aliases..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'dashboard') {
                  setCurrentView('dashboard');
                  setTimeout(() => {
                    const element = document.getElementById('my-urls');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
            />
          </div>

          {/* Top secondary action buttons */}
          <div className="navbar-actions-row">
            {/* New Link button */}
            <button 
              className="btn btn-primary new-link-action-btn" 
              onClick={() => navigateToSection('shorten')}
              title="Create a new short link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Link</span>
            </button>

            {/* Theme toggle button */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme} 
              aria-label="Toggle Theme" 
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* User profile avatar dropdown */}
            <div className="profile-dropdown-container">
              <button 
                className="navbar-avatar-btn" 
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                title="View Account actions"
              >
                <div className="user-avatar-small header-avatar">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="profile-glass-dropdown">
                  <div className="dropdown-user-header">
                    <span className="dropdown-username">{user?.username}</span>
                    <span className="dropdown-email">Pro Account Badge</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item-btn" 
                    onClick={() => {
                      setCurrentView('profile');
                      setProfileDropdownOpen(false);
                    }}
                  >
                    👤 Account Insights
                  </button>
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item-btn logout-item" 
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                  >
                    🚪 Sign out SnapLink
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main scrollable body container */}
        <main className="main-content-scrollspy">
          {currentView === 'profile' ? (
            <Profile onBackToDashboard={() => setCurrentView('dashboard')} />
          ) : currentView === 'analytics' ? (
            <Analytics urls={urls} loading={urlsLoading} />
          ) : (
            <Dashboard 
              urls={urls} 
              loading={urlsLoading} 
              setUrls={setUrls} 
              fetchUrls={fetchUrls}
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [publicStatsCode, setPublicStatsCode] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Lifted URLs data states for SaaS dynamic navigation sync
  const [urls, setUrls] = useState([]);
  const [urlsLoading, setUrlsLoading] = useState(true);
  
  // Modern SaaS Navigation States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  // Shared platform data fetching visible hooks
  const fetchUrls = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/urls`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUrls(data.urls);
      }
    } catch (error) {
      console.error('Fetch URLs error:', error);
    } finally {
      setUrlsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    // 1. Initial fetch on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUrls();

    // 2. Refresh when user switches back to this tab/window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUrls();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Lightweight background refresh every 60 seconds
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUrls();
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [token, isAuthenticated, fetchUrls]);

  // Simple hash-based routing for public stats: #/stats/shortCode
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/stats\/(.+)$/);
      if (match) {
        setPublicStatsCode(match[1]);
      } else {
        setPublicStatsCode(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Dropdown outside click handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileDropdownOpen && !e.target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [profileDropdownOpen]);

  // Section smooth scrolling helper
  const navigateToSection = (sectionId) => {
    if (currentView !== 'dashboard') {
      setCurrentView('dashboard');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setActiveSection(sectionId);
  };

  // Scrollspy logic to automatically highlight active sidebar route
  useEffect(() => {
    if (currentView !== 'dashboard' || !isAuthenticated) return;

    const handleScroll = () => {
      const sections = ['overview', 'shorten', 'my-urls'];
      const scrollPosition = window.scrollY + 180; // height offset

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView, isAuthenticated]);

  // If viewing public stats page
  if (publicStatsCode) {
    return (
      <div className="app-container">
        <nav className="navbar">
          <div className="brand-logo" onClick={() => { window.location.hash = ''; }} style={{ cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>SnapLink</span>
          </div>
          <div className="nav-right">
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <span className="public-nav-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--success)' }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Public Stats
            </span>
          </div>
        </nav>
        <PublicStats
          shortCode={publicStatsCode}
          onBack={() => { window.location.hash = ''; }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
      <Route path="/signup" element={<PublicLayout><SignupPage /></PublicLayout>} />
      <Route path="/verify-otp" element={<PublicLayout><VerifyOtpPage /></PublicLayout>} />
      <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout><ResetPasswordPage /></PublicLayout>} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardShell 
              urls={urls}
              urlsLoading={urlsLoading}
              setUrls={setUrls}
              fetchUrls={fetchUrls}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              profileDropdownOpen={profileDropdownOpen}
              setProfileDropdownOpen={setProfileDropdownOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              currentView={currentView}
              setCurrentView={setCurrentView}
              navigateToSection={navigateToSection}
            />
          </ProtectedRoute>
        } 
      />
      {/* Fallback routing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
