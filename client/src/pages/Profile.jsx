import { useState, useEffect } from 'react';
import { useAuth, API_BASE, BACKEND_BASE } from '../context/AuthContext';

const Profile = ({ onBackToDashboard }) => {
  const { user, token, logout, updateUsername, updatePassword } = useAuth();
  
  // State
  const [urls, setUrls] = useState([]);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrls = async () => {
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
        console.error('Profile metrics loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUrls();
    }
  }, [token]);

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    setUpdatingUsername(true);

    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty.');
      setUpdatingUsername(false);
      return;
    }

    if (newUsername === user?.username) {
      setUsernameError('New username is the same as the current one.');
      setUpdatingUsername(false);
      return;
    }

    const res = await updateUsername(newUsername);
    if (res.success) {
      setUsernameSuccess(res.message);
    } else {
      setUsernameError(res.message);
    }
    setUpdatingUsername(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setUpdatingPassword(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      setUpdatingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      setUpdatingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setUpdatingPassword(false);
      return;
    }

    const res = await updatePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(res.message);
    }
    setUpdatingPassword(false);
  };

  // Calculations
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + curr.clicks, 0);
  const activeLinksCount = urls.filter(u => !u.expiresAt || new Date(u.expiresAt) > new Date()).length;
  const expiredLinksCount = totalUrls - activeLinksCount;
  
  // Resolve top performing link
  const topLink = [...urls].sort((a, b) => b.clicks - a.clicks)[0] || null;

  // Average clicks per link
  const averageClicks = totalUrls > 0 ? (totalClicks / totalUrls).toFixed(1) : '0.0';

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';



  return (
    <div className="profile-page">
      <header className="profile-header">
        <button className="btn btn-secondary" onClick={onBackToDashboard}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
        <div className="profile-title-row">
          <h1>My Account & Insights</h1>
          <p className="profile-subtitle">Manage your credentials, API integrations, and overall link network performance.</p>
        </div>
      </header>

      {loading ? (
        <div className="loader-spinner" style={{ margin: '6rem auto' }}></div>
      ) : (
        <div className="profile-grid">
          {/* Left Column: User Profile Card */}
          <div className="profile-sidebar-col">
            <div className="glass-card profile-sidebar-card">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-circle">
                  <span>{userInitial}</span>
                  <div className="orbital-ring"></div>
                </div>
                <div className="account-badge">
                  <span className="badge-pulse"></span>
                  Active Pro
                </div>
              </div>

              <div className="profile-user-details">
                <h3>{user?.username}</h3>
                <span className="profile-email-text">{user?.email}</span>
              </div>

              <hr className="profile-divider" />

              <div className="sidebar-details-list">
                <div className="sidebar-detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="status-dot-active"></span> Active Account
                  </span>
                </div>
                <div className="sidebar-detail-item">
                  <span className="detail-label">Membership</span>
                  <span className="detail-value text-cyan">Pro Tier</span>
                </div>
                <div className="sidebar-detail-item">
                  <span className="detail-label">Region</span>
                  <span className="detail-value">Global Edge</span>
                </div>
              </div>

              <button className="btn btn-danger profile-logout-btn" onClick={logout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out Account
              </button>
            </div>
          </div>

          {/* Right Column: Key metrics and credentials */}
          <div className="profile-main-col">
            {/* Quick Metrics */}
            <div className="profile-stats-deck">
              <div className="glass-card profile-stat-tile">
                <div className="tile-icon icon-cyan">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div className="tile-info">
                  <span className="tile-label">Short Links</span>
                  <span className="tile-value">{totalUrls}</span>
                </div>
              </div>

              <div className="glass-card profile-stat-tile">
                <div className="tile-icon icon-indigo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="tile-info">
                  <span className="tile-label">Total Clicks</span>
                  <span className="tile-value">{totalClicks}</span>
                </div>
              </div>

              <div className="glass-card profile-stat-tile">
                <div className="tile-icon icon-violet">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className="tile-info">
                  <span className="tile-label">Avg Clicks / Link</span>
                  <span className="tile-value">{averageClicks}</span>
                </div>
              </div>
            </div>

            {/* Performance Overview & Top Link */}
            <div className="glass-card profile-section-card">
              <h3>Link Performance & Health</h3>
              <p className="card-description">A real-time diagnosis of your URL redirection inventory.</p>

              <div className="profile-health-metrics">
                <div className="health-row">
                  <div className="health-label-col">
                    <span>Active Redirections</span>
                    <span className="health-value-span text-success">{activeLinksCount}</span>
                  </div>
                  <div className="health-bar-track">
                    <div 
                      className="health-bar-fill fill-success" 
                      style={{ width: `${totalUrls > 0 ? (activeLinksCount / totalUrls) * 100 : 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="health-row">
                  <div className="health-label-col">
                    <span>Expired Redirections</span>
                    <span className="health-value-span text-error">{expiredLinksCount}</span>
                  </div>
                  <div className="health-bar-track">
                    <div 
                      className="health-bar-fill fill-error" 
                      style={{ width: `${totalUrls > 0 ? (expiredLinksCount / totalUrls) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {topLink ? (
                <div className="top-performing-link-box">
                  <div className="box-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#fbbf24' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>TOP PERFORMING LINK</span>
                  </div>
                  <div className="box-body">
                    <div className="box-link-details">
                      <h4 className="link-title">{topLink.title}</h4>
                      <span className="link-destination" style={{ maxWidth: '100%', whiteSpace: 'normal', wordBreak: 'break-all', overflowWrap: 'break-word', display: 'block' }}>{topLink.longUrl}</span>
                      <a 
                        href={`${BACKEND_BASE}/${topLink.shortCode}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="short-anchor"
                        style={{ marginTop: '0.4rem', display: 'inline-block' }}
                      >
                        {BACKEND_BASE.replace('http://', '').replace('https://', '')}/{topLink.shortCode}
                      </a>
                    </div>
                    <div className="box-click-badge">
                      <span className="click-val">{topLink.clicks}</span>
                      <span className="click-lbl">Clicks</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-top-link-box">
                  <p>Create shortened links and drive traffic to see performance insights here.</p>
                </div>
              )}
            </div>

            {/* Account Settings & Security Card */}
            <div className="glass-card profile-section-card" style={{ marginTop: '2rem' }}>
              <h3>Security & Credentials</h3>
              <p className="card-description">Update your account username or change your login password securely.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1.5rem' }}>
                
                {/* Username Form */}
                <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>👤 Update Username</span>
                  </h4>

                  {usernameError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      color: 'var(--error)',
                      fontSize: '0.8rem'
                    }}>
                      ⚠️ {usernameError}
                    </div>
                  )}

                  {usernameSuccess && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      color: 'var(--success)',
                      fontSize: '0.8rem'
                    }}>
                      ✓ {usernameSuccess}
                    </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Username</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="New username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={updatingUsername}
                        required
                        style={{ flex: 1, padding: '0.6rem 1rem' }}
                      />
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={updatingUsername || newUsername === user?.username}
                        style={{ padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
                      >
                        {updatingUsername ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </form>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.5rem 0' }} />

                {/* Password Form */}
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🔒 Change Account Password</span>
                  </h4>

                  {passwordError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      color: 'var(--error)',
                      fontSize: '0.8rem'
                    }}>
                      ⚠️ {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      color: 'var(--success)',
                      fontSize: '0.8rem'
                    }}>
                      ✓ {passwordSuccess}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={updatingPassword}
                        required
                        style={{ padding: '0.6rem 1rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={updatingPassword}
                        required
                        style={{ padding: '0.6rem 1rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={updatingPassword}
                        required
                        style={{ padding: '0.6rem 1rem' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={updatingPassword}
                    style={{ padding: '0.7rem 1.5rem', alignSelf: 'flex-start' }}
                  >
                    {updatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
