import { useState, useEffect } from 'react';
import { useAuth, API_BASE, BACKEND_BASE } from '../context/AuthContext';
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Card,
  Typography
} from '@mui/material';

const Profile = ({ onBackToDashboard }) => {
  const { user, token, logout, updateUsername, updatePassword } = useAuth();

  const [urls, setUrls] = useState([]);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [prevUsername, setPrevUsername] = useState(user?.username);

  if (user?.username && user.username !== prevUsername) {
    setPrevUsername(user.username);
    setNewUsername(user.username);
  }

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        const response = await fetch(`${API_BASE}/urls`, {
          headers: {
            Authorization: `Bearer ${token}`
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

  const totalUrls = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + curr.clicks, 0);
  const activeLinksCount = urls.filter((u) => !u.expiresAt || new Date(u.expiresAt) > new Date()).length;
  const expiredLinksCount = totalUrls - activeLinksCount;

  const topLink = [...urls].sort((a, b) => b.clicks - a.clicks)[0] || null;
  const averageClicks = totalUrls > 0 ? (totalClicks / totalUrls).toFixed(1) : '0.0';
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="profile-page container-fluid px-4 py-4">
      <header className="profile-header mb-4">
        <Button
          variant="outlined"
          color="inherit"
          onClick={onBackToDashboard}
          sx={{ alignSelf: 'flex-start', mb: 2 }}
        >
          ← Back to Dashboard
        </Button>
        <div className="profile-title-row">
          <h1>My Account & Insights</h1>
          <p className="profile-subtitle">
            Manage your credentials, API integrations, and overall link network performance.
          </p>
        </div>
      </header>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <div className="row g-4">
          {/* Left Column: User Profile Card */}
          <div className="col-12 col-lg-4">
            <Card className="profile-sidebar-card h-100" sx={{ p: 3, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
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

              <div className="profile-user-details text-center">
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

              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={logout}
                sx={{ mt: 'auto' }}
              >
                Sign Out Account
              </Button>
            </Card>
          </div>

          {/* Right Column: Key metrics and security forms */}
          <div className="col-12 col-lg-8">
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <Card className="profile-stat-tile h-100" sx={{ p: 2, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
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
                </Card>
              </div>

              <div className="col-12 col-md-4">
                <Card className="profile-stat-tile h-100" sx={{ p: 2, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
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
                </Card>
              </div>

              <div className="col-12 col-md-4">
                <Card className="profile-stat-tile h-100" sx={{ p: 2, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
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
                </Card>
              </div>
            </div>

            {/* Link Performance & Health Card */}
            <Card className="profile-section-card mb-4" sx={{ p: 3, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
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
                      <span className="link-destination" style={{ maxWidth: '100%', whiteSpace: 'normal', wordBreak: 'break-all', overflowWrap: 'break-word', display: 'block' }}>
                        {topLink.longUrl}
                      </span>
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
            </Card>

            {/* Security & Credentials Card */}
            <Card className="profile-section-card" sx={{ p: 3, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <h3>Security & Credentials</h3>
              <p className="card-description">Update your account username or change your login password securely.</p>

              <div className="row g-4 mt-1">
                {/* Username Form */}
                <div className="col-12">
                  <form onSubmit={handleUpdateUsername}>
                    <Typography variant="subtitle2" className="mb-2" sx={{ color: 'var(--text-heading)', fontWeight: 600 }}>
                      👤 Update Username
                    </Typography>

                    {usernameError && (
                      <Alert severity="error" className="mb-2" sx={{ borderRadius: 2 }}>
                        {usernameError}
                      </Alert>
                    )}

                    {usernameSuccess && (
                      <Alert severity="success" className="mb-2" sx={{ borderRadius: 2 }}>
                        {usernameSuccess}
                      </Alert>
                    )}

                    <Box display="flex" gap={2} alignItems="center">
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="New username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={updatingUsername}
                        required
                        slotProps={{
                          input: {
                            style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={updatingUsername || newUsername === user?.username}
                        sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' }, whiteSpace: 'nowrap', py: 1 }}
                      >
                        {updatingUsername ? <CircularProgress size={20} color="inherit" /> : 'Update'}
                      </Button>
                    </Box>
                  </form>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '1rem 0' }} />

                {/* Password Form */}
                <div className="col-12">
                  <form onSubmit={handleUpdatePassword}>
                    <Typography variant="subtitle2" className="mb-2" sx={{ color: 'var(--text-heading)', fontWeight: 600 }}>
                      🔒 Change Account Password
                    </Typography>

                    {passwordError && (
                      <Alert severity="error" className="mb-2" sx={{ borderRadius: 2 }}>
                        {passwordError}
                      </Alert>
                    )}

                    {passwordSuccess && (
                      <Alert severity="success" className="mb-2" sx={{ borderRadius: 2 }}>
                        {passwordSuccess}
                      </Alert>
                    )}

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-4">
                        <TextField
                          fullWidth
                          size="small"
                          label="Current Password"
                          type="password"
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={updatingPassword}
                          required
                          slotProps={{
                            input: {
                              style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                            }
                          }}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <TextField
                          fullWidth
                          size="small"
                          label="New Password"
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={updatingPassword}
                          required
                          slotProps={{
                            input: {
                              style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                            }
                          }}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <TextField
                          fullWidth
                          size="small"
                          label="Confirm New Password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={updatingPassword}
                          required
                          slotProps={{
                            input: {
                              style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={updatingPassword}
                      sx={{ bgcolor: 'var(--primary)', '&:hover': { bgcolor: 'var(--primary-hover)' }, py: 1 }}
                    >
                      {updatingPassword ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
