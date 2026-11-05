import { useState, useEffect } from 'react';
import { API_BASE, BACKEND_BASE } from '../context/AuthContext';
import { Button, Card, CircularProgress, Box, Alert } from '@mui/material';

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
      fetchStats(false);
      const intervalId = setInterval(() => {
        fetchStats(true);
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [shortCode]);

  if (loading) {
    return (
      <div className="public-stats-page container py-5">
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-stats-page container py-5">
        <div className="public-stats-error text-center py-5">
          <Alert severity="error" className="mb-4 d-inline-flex" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
          <div>
            <Button variant="outlined" color="inherit" onClick={onBack}>
              ← Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = BACKEND_BASE;

  return (
    <div className="public-stats-page container py-4" style={{ maxWidth: 900 }}>
      <div className="public-stats-container">
        {/* Header */}
        <div className="public-stats-header mb-4">
          <Button variant="outlined" color="inherit" onClick={onBack} size="small" sx={{ mb: 2 }}>
            ← Back
          </Button>
          <div className="public-stats-badge mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--success)', marginRight: 4 }}>
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

        {/* Summary Cards Row using Bootstrap grid */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-md-3">
            <Card className="summary-tile h-100 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <span>Total Clicks</span>
              <h4 style={{ fontSize: '1.8rem', color: 'var(--primary)', margin: '0.25rem 0 0 0' }}>{stats.totalClicks}</h4>
            </Card>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <Card className="summary-tile h-100 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <span>Last Visited</span>
              <h4 style={{ fontSize: '1rem', margin: '0.25rem 0 0 0' }}>{stats.lastVisitedAt ? new Date(stats.lastVisitedAt).toLocaleString() : 'Never'}</h4>
            </Card>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <Card className="summary-tile h-100 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <span>Created</span>
              <h4 style={{ fontSize: '1rem', margin: '0.25rem 0 0 0' }}>{new Date(stats.createdAt).toLocaleDateString()}</h4>
            </Card>
          </div>
          {stats.expiresAt && (
            <div className="col-12 col-sm-6 col-md-3">
              <Card className="summary-tile h-100 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
                <span>Expires</span>
                <h4 style={{ fontSize: '1rem', margin: '0.25rem 0 0 0' }}>{new Date(stats.expiresAt).toLocaleDateString()}</h4>
              </Card>
            </div>
          )}
        </div>

        {/* Daily Trends Chart */}
        <Card className="analytics-block mb-4 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
          <h4>Click Trends — Last 7 Days</h4>
          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 700 200">
              <line x1="50" y1="40" x2="660" y2="40" className="chart-grid-line" />
              <line x1="50" y1="90" x2="660" y2="90" className="chart-grid-line" />
              <line x1="50" y1="140" x2="660" y2="140" className="chart-grid-line" />
              <line x1="50" y1="170" x2="660" y2="170" className="chart-base-line" strokeWidth="1" />

              {stats.dailyTrends.map((trend, i) => {
                const maxClicks = Math.max(...stats.dailyTrends.map((t) => t.clicks), 5);
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
        </Card>

        {/* Analytics Breakdowns using Bootstrap grid */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-6">
            <Card className="analytics-block h-100 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <h4>Top Browsers</h4>
              <div className="ratio-list">
                {stats.browsers.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data yet</span>
                ) : (
                  stats.browsers.map((item) => {
                    const percent = stats.totalClicks > 0 ? Math.round((item.count / stats.totalClicks) * 100) : 0;
                    return (
                      <div key={item.name} className="ratio-item mb-2">
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
            </Card>
          </div>

          <div className="col-12 col-md-6">
            <Card className="analytics-block h-100 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <h4>Devices</h4>
              <div className="ratio-list">
                {stats.devices.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data yet</span>
                ) : (
                  stats.devices.map((item) => {
                    const percent = stats.totalClicks > 0 ? Math.round((item.count / stats.totalClicks) * 100) : 0;
                    return (
                      <div key={item.name} className="ratio-item mb-2">
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
            </Card>
          </div>
        </div>

        {/* Countries */}
        {stats.countries.length > 0 && (
          <Card className="analytics-block mb-4 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <h4>Top Visitor Countries</h4>
            <div className="ratio-list">
              {stats.countries.map((item) => {
                const percent = stats.totalClicks > 0 ? Math.round((item.count / stats.totalClicks) * 100) : 0;
                return (
                  <div key={item.name} className="ratio-item mb-2">
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
          </Card>
        )}

        {/* Recent Visits */}
        <Card className="analytics-block mb-4 p-3" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
          <h4>Recent Visitors</h4>
          <div className="timeline">
            {stats.recentVisits.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No visitors recorded yet</span>
            ) : (
              stats.recentVisits.map((visit, index) => (
                <div key={index} className="timeline-item mb-2">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <span style={{ fontWeight: 600 }}>Visitor from {visit.country}</span>
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
        </Card>

        {/* Footer */}
        <div className="public-stats-footer text-center pt-4 border-top">
          <p>Powered by <strong>SnapLink</strong> — URL Shortener with Analytics</p>
        </div>
      </div>
    </div>
  );
};

export default PublicStats;
