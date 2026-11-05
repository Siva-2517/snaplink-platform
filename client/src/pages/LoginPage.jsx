import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '../context/ThemeContext';
import { TextField, Button, Alert, CircularProgress, Box, Typography } from '@mui/material';

const LoginPage = () => {
  const { login, isAuthenticated, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showVerifyLink, setShowVerifyLink] = useState(false);

  const emailRef = useRef(null);

  // Auto-focus first input field on mount
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Google Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Google Sign-In was cancelled or failed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setShowVerifyLink(false);
    setSubmitting(true);

    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMessage(res.message);
        setEmail('');
        setPassword('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setErrorMessage(res.message);
        if (res.isVerified === false) {
          setShowVerifyLink(true);
        }
      }
    } catch {
      setErrorMessage('An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page container py-4">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-md-8 col-lg-5 col-xl-4">
          <div className="auth-card">
            <div className="auth-header">
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>SnapLink</span>
                </div>
              </Link>
              <h2>Welcome Back</h2>
              <p>Access your high-performance redirection analytics</p>
            </div>

            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <Alert severity="error" className="mb-3" sx={{ borderRadius: 2 }}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <span>{errorMessage}</span>
                    {showVerifyLink && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/verify-otp', { state: { email } })}
                        sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      >
                        Verify Account Now
                      </Button>
                    )}
                  </Box>
                </Alert>
              )}

              {successMessage && (
                <Alert severity="success" className="mb-3" sx={{ borderRadius: 2 }}>
                  {successMessage}
                </Alert>
              )}

              <Box className="mb-3">
                <TextField
                  inputRef={emailRef}
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  size="small"
                  slotProps={{
                    input: {
                      style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                    }
                  }}
                />
              </Box>

              <Box className="mb-3">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Password
                  </Typography>
                  <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </Box>
                <TextField
                  fullWidth
                  type="password"
                  variant="outlined"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  size="small"
                  slotProps={{
                    input: {
                      style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                    }
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{
                  py: 1.2,
                  bgcolor: 'var(--primary)',
                  '&:hover': { bgcolor: 'var(--primary-hover)' },
                  fontWeight: 600,
                  boxShadow: '0 4px 14px 0 var(--primary-glow)'
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Access Dashboard'}
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
                <span style={{ padding: '0 0.75rem' }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <GoogleLogin
                  key={theme}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                  shape="pill"
                  text="signin_with"
                  width="100%"
                />
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
