import { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';

const PublicStats = ({ shortCode, onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async (isSilent = false) => {
      try {
        const response = await fetch(`${API_BASE}/public/stats/${shortCode}`);
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        } else if (!isSilent) {
          setError(data.message || 'Stats not found.');
        }
      } catch {
        if (!isSilent) {
          setError('Failed to connect to the server.');
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    };

    if (shortCode) {
      // First load (not silent, shows spinner)
      fetchStats(false);

      // Set up background polling (silent, no loading flicker)
      const intervalId = setInterval(() => {
        fetchStats(true);
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [shortCode]);

  if (loading) {
    return (
      <div className="public-stats-page">
        <div className="loader-spinner" style={{ margin: '6rem auto' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-stats-page">
        <div className="public-stats-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--error)' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2>Link Not Found</h2>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={onBack}>← Go Back</button>
        </div>
      </div>
    );
  }

  const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.host}`;

  return (
    <div className="public-stats-page">
      <div className="public-stats-container">
        {/* Header */}
        <div className="public-stats-header">
          <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className="public-stats-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--success)' }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            PUBLIC STATISTICS
          </div>
          <h1 className="public-stats-title">{stats.title}</h1>
          <div className="public-stats-link-row">
            <a href={`${baseUrl}/${stats.shortCode}`} target="_blank" rel="noreferrer" className="short-anchor" style={{ fontSize: '1.1rem' }}>
              {baseUrl.replace('http://', '').replace('https://', '')}/{stats.shortCode}
            </a>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→</span>
            <span className="link-destination" style={{ maxWidth: '400px' }}>{stats.longUrl}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="analytics-summary" style={{ marginTop: '2rem' }}>
          <div className="summary-tile">
            <span>Total Clicks</span>
            <h4 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.totalClicks}</h4>
          </div>
          <div className="summary-tile">
            <span>Last Visited</span>
            <h4>{stats.lastVisitedAt ? new Date(stats.lastVisitedAt).toLocaleString() : 'Never'}</h4>
          </div>
          <div className="summary-tile">
            <span>Created</span>
            <h4>{new Date(stats.createdAt).toLocaleDateString()}</h4>
          </div>
          {stats.expiresAt && (
            <div className="summary-tile">
              <span>Expires</span>
              <h4>{new Date(stats.expiresAt).toLocaleDateString()}</h4>
            </div>
          )}
        </div>

        {/* Daily Trends Chart */}
        <div className="analytics-block" style={{ marginTop: '1.5rem' }}>
          <h4>Click Trends — Last 7 Days</h4>
          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 700 200">
              <line x1="50" y1="40" x2="660" y2="40" className="chart-grid-line" />
              <line x1="50" y1="90" x2="660" y2="90" className="chart-grid-line" />
              <line x1="50" y1="140" x2="660" y2="140" className="chart-grid-line" />
              <line x1="50" y1="170" x2="660" y2="170" className="chart-base-line" strokeWidth="1" />

              {stats.dailyTrends.map((trend, i) => {
                const maxClicks = Math.max(...stats.dailyTrends.map(t => t.clicks), 5);
                const chartHeight = 130;
                const colHeight = (trend.clicks / maxClicks) * chartHeight;
                const x = 75 + i * 82;
                const y = 170 - colHeight;

                return (
                  <g key={trend.date}>
                    <rect x={x} y={y} width="34" height={colHeight} className="chart-bar" />
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

        {/* Analytics Breakdowns */}
        <div className="analytics-row" style={{ marginTop: '1.5rem' }}>
          <div className="analytics-block">
            <h4>Top Browsers</h4>
            <div className="ratio-list">
              {stats.browsers.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data yet</span>
              ) : (
                stats.browsers.map(item => {
                  const percent = stats.totalClicks > 0 ? Math.round((item.count / stats.totalClicks) * 100) : 0;
                  return (
                    <div key={item.name} className="ratio-item">
                      <div className="ratio-info">
                        <span className="ratio-name">{item.name}</span>
                        <span className="ratio-val">{item.count} ({percent}%)</span>
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
            <h4>Devices</h4>
            <div className="ratio-list">
              {stats.devices.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data yet</span>
              ) : (
                stats.devices.map(item => {
                  const percent = stats.totalClicks > 0 ? Math.round((item.count / stats.totalClicks) * 100) : 0;
                  return (
                    <div key={item.name} className="ratio-item">
                      <div className="ratio-info">
                        <span className="ratio-name">{item.name}</span>
                        <span className="ratio-val">{item.count} ({percent}%)</span>
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

        {/* Countries */}
        {stats.countries.length > 0 && (
          <div className="analytics-block" style={{ marginTop: '1.5rem' }}>
            <h4>Top Visitor Countries</h4>
            <div className="ratio-list">
              {stats.countries.map(item => {
                const percent = stats.totalClicks > 0 ? Math.round((item.count / stats.totalClicks) * 100) : 0;
                return (
                  <div key={item.name} className="ratio-item">
                    <div className="ratio-info">
                      <span className="ratio-name">{item.name}</span>
                      <span className="ratio-val">{item.count} ({percent}%)</span>
                    </div>
                    <div className="ratio-track">
                      <div className="ratio-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Visits */}
        <div className="analytics-block" style={{ marginTop: '1.5rem' }}>
          <h4>Recent Visitors</h4>
          <div className="timeline">
            {stats.recentVisits.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No visitors recorded yet</span>
            ) : (
              stats.recentVisits.map((visit, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span style={{ fontWeight: 600 }}>
                      Visitor from {visit.country}
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

        {/* Footer */}
        <div className="public-stats-footer">
          <p>Powered by <strong>SnapLink</strong> — URL Shortener with Analytics</p>
        </div>
      </div>
    </div>
  );
};

export default PublicStats;
