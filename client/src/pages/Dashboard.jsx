import { useState, useCallback } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';

const Dashboard = ({ urls = [], loading = true, setUrls, searchQuery, setSearchQuery }) => {
  const { token } = useAuth();
  
  // Shortener form states
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [title, setTitle] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [shortening, setShortening] = useState(false);
  
  // Modal states
  const [activeUrlAnalytics, setActiveUrlAnalytics] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [editingUrl, setEditingUrl] = useState(null);
  const [editLongUrl, setEditLongUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  
  // Bulk CSV states
  const [bulkCsvContent, setBulkCsvContent] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  
  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);




  // Handle URL Shortening submission
  const handleShortenSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;

    setShortening(true);
    try {
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          longUrl,
          customAlias: customAlias || undefined,
          expiresAt: expiresAt || undefined,
          title: title || undefined
        })
      });
      const data = await response.json();

      if (data.success) {
        addToast('Link generated successfully!', 'success');
        setUrls(prev => [data.url, ...prev]);
        
        // Reset inputs
        setLongUrl('');
        setCustomAlias('');
        setExpiresAt('');
        setTitle('');
        setIsDrawerOpen(false);
      } else {
        addToast(data.message || 'Error shortening URL', 'error');
      }
    } catch (error) {
      console.error('Shorten error:', error);
      addToast('Network error, please try again.', 'error');
    } finally {
      setShortening(false);
    }
  };

  // Copy Short Link to clipboard
  const handleCopyLink = (code) => {
    const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.host}`;
    const shortLink = `${baseUrl}/${code}`;
    
    navigator.clipboard.writeText(shortLink);
    addToast('Link copied to clipboard!', 'success');
  };

  // Delete short link (soft delete)
  const handleDeleteLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this short URL? Its analytics will be archived but the redirection will stop immediately.')) return;

    try {
      const response = await fetch(`${API_BASE}/urls/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        addToast('Link deleted successfully!', 'success');
        setUrls(prev => prev.filter(url => url._id !== id));
      } else {
        addToast(data.message || 'Failed to delete URL', 'error');
      }
    } catch {
      addToast('Network error while deleting URL.', 'error');
    }
  };

  // Generate and display QR Code
  const handleViewQRCode = async (id) => {
    setQrCodeUrl(null);
    try {
      const response = await fetch(`${API_BASE}/urls/${id}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setQrCodeUrl(data.qrCode);
      } else {
        addToast(data.message || 'Failed to generate QR Code', 'error');
      }
    } catch {
      addToast('Network error fetching QR Code', 'error');
    }
  };

  // Edit Link handlers
  const handleStartEdit = (url) => {
    setEditingUrl(url);
    setEditLongUrl(url.longUrl);
    setEditTitle(url.title);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLongUrl) return;

    setEditSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/urls/${editingUrl._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          longUrl: editLongUrl,
          title: editTitle
        })
      });
      const data = await response.json();

      if (data.success) {
        addToast('Redirect destination updated!', 'success');
        setUrls(prev => prev.map(u => u._id === editingUrl._id ? data.url : u));
        setEditingUrl(null);
      } else {
        addToast(data.message || 'Failed to update URL', 'error');
      }
    } catch {
      addToast('Network error during editing.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // View Advanced Analytics
  const handleViewAnalytics = async (id) => {
    setActiveUrlAnalytics(null);
    try {
      const response = await fetch(`${API_BASE}/urls/${id}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setActiveUrlAnalytics(data.analytics);
      } else {
        addToast(data.message || 'Failed to load analytics details', 'error');
      }
    } catch {
      addToast('Network error loading analytics data.', 'error');
    }
  };

  // Copy Public Stats Link
  const handleSharePublicStats = (code) => {
    const publicUrl = `${window.location.origin}/#/stats/${code}`;
    navigator.clipboard.writeText(publicUrl);
    addToast('Public stats link copied to clipboard!', 'success');
  };

  // Bulk CSV Upload Handler
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkCsvContent.trim()) return;

    setBulkUploading(true);
    setBulkResults(null);
    try {
      const response = await fetch(`${API_BASE}/urls/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ csvContent: bulkCsvContent })
      });
      const data = await response.json();

      if (data.success) {
        addToast(data.message, 'success');
        setBulkResults(data);
        // Add newly created URLs to the list
        if (data.urls && data.urls.length > 0) {
          setUrls(prev => [...data.urls.reverse(), ...prev]);
        }
        setBulkCsvContent('');
      } else {
        addToast(data.message || 'Bulk upload failed', 'error');
      }
    } catch {
      addToast('Network error during bulk upload.', 'error');
    } finally {
      setBulkUploading(false);
    }
  };

  // Handle CSV file selection
  const handleCsvFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      addToast('Please select a .csv or .txt file.', 'error');
      return;
    }

    if (file.size > 500 * 1024) {
      addToast('File too large. Maximum size is 500KB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBulkCsvContent(event.target.result);
      addToast(`Loaded ${file.name} successfully!`, 'info');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Calculate Aggregated Metrics
  const totalClicks = urls.reduce((acc, curr) => acc + curr.clicks, 0);
  const activeLinks = urls.filter(u => !u.expiresAt || new Date(u.expiresAt) > new Date()).length;
  const linkHealthRatio = urls.length > 0 ? Math.round((activeLinks / urls.length) * 100) : 100;

  // Filter links based on search query
  const filteredUrls = urls.filter(url => {
    const query = searchQuery.toLowerCase();
    return (
      url.title.toLowerCase().includes(query) ||
      url.shortCode.toLowerCase().includes(query) ||
      (url.customAlias && url.customAlias.toLowerCase().includes(query)) ||
      url.longUrl.toLowerCase().includes(query)
    );
  });
  return (
    <div className="dashboard-page">
      {/* Overview Stat Cards Row */}
      <section id="overview" className="stats-deck">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Short Links</span>
            <span className="stat-value">{urls.length}</span>
          </div>
        </div>

        <div className="stat-card active-links">
          <div className="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Links</span>
            <span className="stat-value">{activeLinks}</span>
          </div>
        </div>

        <div className="stat-card clicks">
          <div className="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              <path d="M12 6v6h8" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total visitor clicks</span>
            <span className="stat-value">{totalClicks}</span>
          </div>
        </div>

        <div className="stat-card ratio">
          <div className="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Link Ratio</span>
            <span className="stat-value">{linkHealthRatio}%</span>
          </div>
        </div>
      </section>

      {/* URL Shortening Form Widget */}
      <section id="shorten" className="shortener-widget">
        <h3 className="widget-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Shorten a New Destination URL
        </h3>
        
        <form onSubmit={handleShortenSubmit}>
          <div className="shortener-bar">
            <input 
              type="url" 
              className="form-input" 
              placeholder="Paste your long target URL here... (e.g. https://github.com/google/deepmind)" 
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              disabled={shortening}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }} disabled={shortening}>
              {shortening ? 'Shortening...' : 'Generate link'}
            </button>
          </div>

          <button 
            type="button" 
            className="collapsible-trigger"
            onClick={() => setIsDrawerOpen(prev => !prev)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isDrawerOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Advanced Custom Settings
          </button>

          <div className={`collapsible-drawer ${isDrawerOpen ? 'open' : ''}`}>
            <div className="drawer-grid">
              <div className="form-group">
                <label className="form-label">Custom Back-Half Alias (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. deepmind-hack"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Link Expiration Date (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="form-input"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Friendly Link Title / Preview Name (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Deepmind GitHub Repo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
        </form>
      </section>

      {/* Bulk CSV Upload Section */}
      <section className="shortener-widget">
        <button
          type="button"
          className="collapsible-trigger"
          style={{ marginTop: 0, fontSize: '1.1rem' }}
          onClick={() => setIsBulkDrawerOpen(prev => !prev)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isBulkDrawerOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-cyan)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Bulk CSV Upload — Import Multiple URLs
        </button>

        <div className={`collapsible-drawer ${isBulkDrawerOpen ? 'open' : ''}`}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.6' }}>
            Paste CSV content or upload a <code>.csv</code> file. Supported formats:<br/>
            <strong>Simple:</strong> One URL per line<br/>
            <strong>CSV:</strong> <code>url, custom_alias, title</code> (alias and title are optional columns)
          </p>

          <form onSubmit={handleBulkUpload}>
            <textarea
              className="form-input bulk-csv-textarea"
              placeholder={`https://example.com/page-one\nhttps://example.com/page-two\nhttps://example.com/page-three\n\nOr with columns:\nurl, alias, title\nhttps://example.com, my-alias, My Link Title`}
              value={bulkCsvContent}
              onChange={(e) => setBulkCsvContent(e.target.value)}
              disabled={bulkUploading}
              rows={6}
            />

            <div className="bulk-actions-row">
              <label className="btn btn-secondary bulk-file-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload .csv File
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileSelect}
                  style={{ display: 'none' }}
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={bulkUploading || !bulkCsvContent.trim()}
              >
                {bulkUploading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="loader-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', margin: 0 }}></span>
                    Processing...
                  </span>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                    Shorten All URLs
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bulk Results Summary */}
          {bulkResults && (
            <div className="bulk-results">
              <div className="bulk-summary-row">
                <div className="bulk-summary-chip success">
                  <span className="chip-value">{bulkResults.summary.created}</span>
                  <span className="chip-label">Created</span>
                </div>
                {bulkResults.summary.failed > 0 && (
                  <div className="bulk-summary-chip error">
                    <span className="chip-value">{bulkResults.summary.failed}</span>
                    <span className="chip-label">Failed</span>
                  </div>
                )}
                <div className="bulk-summary-chip">
                  <span className="chip-value">{bulkResults.summary.total}</span>
                  <span className="chip-label">Total</span>
                </div>
              </div>

              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <div className="bulk-errors">
                  <h5 style={{ color: 'var(--error)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Failed Rows:</h5>
                  {bulkResults.errors.map((err, idx) => (
                    <div key={idx} className="bulk-error-item">
                      <span>Row {err.row}: {err.url}</span>
                      <span style={{ color: 'var(--error)' }}>{err.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Shortened URL List Section */}
      <section id="my-urls" className="urls-list-section">
        <div className="feed-header">
          <h3>Your Shortened Connections</h3>
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search links..." 
              style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="loader-spinner" style={{ margin: '4rem auto' }}></div>
        ) : filteredUrls.length === 0 ? (
          <div className="empty-state">
            <h4>No links discovered</h4>
            <p>{searchQuery ? 'No links match your search query.' : 'Get started by creating your very first snap link above!'}</p>
          </div>
        ) : (
          <div className="links-grid">
            {filteredUrls.map(url => {
              const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();
              const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.host}`;
              
              return (
                <div key={url._id} className="link-card">
                  <div className="link-left">
                    <span className="link-title">{url.title}</span>
                    <span className="link-destination" title={url.longUrl}>{url.longUrl}</span>
                    <div className="link-short-row">
                      <a href={`${baseUrl}/${url.shortCode}`} target="_blank" rel="noreferrer" className="short-anchor">
                        {baseUrl.replace('http://', '').replace('https://', '')}/{url.shortCode}
                      </a>
                      
                      <button 
                        className="btn btn-secondary btn-icon" 
                        style={{ border: 'none', background: 'transparent', padding: '0.15rem' }}
                        title="Copy to clipboard"
                        onClick={() => handleCopyLink(url.shortCode)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>

                      {url.customAlias && (
                        <span className="badge badge-alias">Alias</span>
                      )}

                      {url.expiresAt && (
                        <span className={`badge ${isExpired ? 'badge-expired' : 'badge-expiry'}`}>
                          {isExpired ? 'Expired' : `Expires: ${new Date(url.expiresAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="link-right">
                    <div className="click-badge">
                      <span className="click-count">{url.clicks}</span>
                      <span className="click-label">Clicks</span>
                    </div>

                    <div className="card-actions">
                      <button 
                        className="btn btn-secondary btn-icon"
                        title="Visitor Analytics Insights"
                        onClick={() => handleViewAnalytics(url._id)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </button>

                      <button 
                        className="btn btn-secondary btn-icon"
                        title="Share Public Stats Page"
                        onClick={() => handleSharePublicStats(url.shortCode)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                      </button>

                      <button 
                        className="btn btn-secondary btn-icon"
                        title="Physical QR Code"
                        onClick={() => handleViewQRCode(url._id)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                          <line x1="7" y1="7" x2="7.01" y2="7" />
                          <line x1="17" y1="7" x2="17.01" y2="7" />
                          <line x1="17" y1="17" x2="17.01" y2="17" />
                          <line x1="7" y1="17" x2="7.01" y2="17" />
                        </svg>
                      </button>

                      <button 
                        className="btn btn-secondary btn-icon"
                        title="Edit Target URL"
                        onClick={() => handleStartEdit(url)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>

                      <button 
                        className="btn btn-danger btn-icon"
                        title="Archive Short Link"
                        onClick={() => handleDeleteLink(url._id)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>



      {/* --- Advanced Analytics Modal overlay --- */}
      {activeUrlAnalytics && (
        <div className="modal-overlay" onClick={() => setActiveUrlAnalytics(null)}>
          <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Analytics Insights: {activeUrlAnalytics.title}</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setActiveUrlAnalytics(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="analytics-summary">
                <div className="summary-tile">
                  <span>Cumulative Clicks</span>
                  <h4>{activeUrlAnalytics.totalClicks}</h4>
                </div>
                <div className="summary-tile">
                  <span>Last Visited</span>
                  <h4>{activeUrlAnalytics.lastVisitedAt ? new Date(activeUrlAnalytics.lastVisitedAt).toLocaleString() : 'Never'}</h4>
                </div>
                <div className="summary-tile">
                  <span>Creation Date</span>
                  <h4>{new Date(activeUrlAnalytics.createdAt).toLocaleDateString()}</h4>
                </div>
              </div>

              {/* Responsive SVG click chart */}
              <div className="analytics-block">
                <h4>Click Trend Over Time (Last 7 Days)</h4>
                <div className="chart-container">
                  <svg className="chart-svg" viewBox="0 0 700 200">
                    {/* Horizontal Grid lines */}
                    <line x1="50" y1="40" x2="660" y2="40" className="chart-grid-line" />
                    <line x1="50" y1="90" x2="660" y2="90" className="chart-grid-line" />
                    <line x1="50" y1="140" x2="660" y2="140" className="chart-grid-line" />
                    <line x1="50" y1="170" x2="660" y2="170" className="chart-base-line" strokeWidth="1" />

                    {/* Plot columns */}
                    {activeUrlAnalytics.dailyTrends.map((trend, i) => {
                      const maxClicks = Math.max(...activeUrlAnalytics.dailyTrends.map(t => t.clicks), 5);
                      const chartHeight = 130; // base height scale
                      const colHeight = (trend.clicks / maxClicks) * chartHeight;
                      const x = 75 + i * 82;
                      const y = 170 - colHeight;

                      return (
                        <g key={trend.date}>
                          <rect 
                            x={x} 
                            y={y} 
                            width="34" 
                            height={colHeight} 
                            className="chart-bar"
                          />
                          <text x={x + 17} y={y - 6} className="chart-text" style={{ fill: 'var(--text-heading)', fontWeight: 600 }}>
                            {trend.clicks}
                          </text>
                          <text x={x + 17} y="186" className="chart-text">
                            {new Date(trend.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="analytics-row">
                <div className="analytics-block">
                  <h4>Top Visitor Browsers</h4>
                  <div className="ratio-list">
                    {activeUrlAnalytics.browsers.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data available</span>
                    ) : (
                      activeUrlAnalytics.browsers.map(item => {
                        const percent = activeUrlAnalytics.totalClicks > 0 ? Math.round((item.count / activeUrlAnalytics.totalClicks) * 100) : 0;
                        return (
                          <div key={item.name} className="ratio-item">
                            <div className="ratio-info">
                              <span className="ratio-name">{item.name}</span>
                              <span className="ratio-val">{item.count} clicks ({percent}%)</span>
                            </div>
                            <div className="ratio-track">
                              <div className="ratio-fill" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="analytics-block">
                  <h4>Top Devices Used</h4>
                  <div className="ratio-list">
                    {activeUrlAnalytics.devices.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data available</span>
                    ) : (
                      activeUrlAnalytics.devices.map(item => {
                        const percent = activeUrlAnalytics.totalClicks > 0 ? Math.round((item.count / activeUrlAnalytics.totalClicks) * 100) : 0;
                        return (
                          <div key={item.name} className="ratio-item">
                            <div className="ratio-info">
                              <span className="ratio-name">{item.name}</span>
                              <span className="ratio-val">{item.count} clicks ({percent}%)</span>
                            </div>
                            <div className="ratio-track">
                              <div className="ratio-fill" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="analytics-row">
                <div className="analytics-block" style={{ gridColumn: 'span 2' }}>
                  <h4>Recent Visitors Timeline</h4>
                  <div className="timeline">
                    {activeUrlAnalytics.recentVisits.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No visitors recorded yet</span>
                    ) : (
                      activeUrlAnalytics.recentVisits.map((visit, index) => (
                        <div key={visit._id || index} className="timeline-item">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <span style={{ fontWeight: 600 }}>
                              Visitor from {visit.country} (IP: {visit.ip})
                            </span>
                            <span className="timeline-meta">
                              Device: {visit.device} • OS: {visit.os} • Browser: {visit.browser}
                            </span>
                            <span className="timeline-meta">
                              Time: {new Date(visit.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveUrlAnalytics(null)}>Close analytics</button>
            </div>
          </div>
        </div>
      )}

      {/* --- QR Code Display Modal overlay --- */}
      {qrCodeUrl && (
        <div className="modal-overlay" onClick={() => setQrCodeUrl(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>SnapLink QR Code</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setQrCodeUrl(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body qr-code-box">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                Scan this QR code with a physical mobile camera to test server redirection instantly.
              </p>
              <img src={qrCodeUrl} className="qr-img" alt="SnapLink QR Code" />
              <a href={qrCodeUrl} download="snaplink_qr.png" className="btn btn-primary">
                Download PNG Code
              </a>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setQrCodeUrl(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit URL Modal overlay --- */}
      {editingUrl && (
        <div className="modal-overlay" onClick={() => setEditingUrl(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Short Link: {editingUrl.shortCode}</h3>
              <button 
                className="btn btn-secondary btn-icon" 
                style={{ border: 'none', background: 'transparent' }}
                onClick={() => setEditingUrl(null)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Link Preview Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Long URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    value={editLongUrl}
                    onChange={(e) => setEditLongUrl(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUrl(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Updating...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Toast Notifications Feed */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '⚠️'}
            {toast.type === 'info' && '📡'}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
