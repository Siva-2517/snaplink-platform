import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Alert, CircularProgress, Box } from '@mui/material';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef(null);

  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    if (!email) {
      setErrorMessage('Please provide your email address.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 1500);
      } else {
        setErrorMessage(res.message);
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
              <h2>Reset Password</h2>
              <p>We'll send you a 6-digit verification code to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <Alert severity="error" className="mb-3" sx={{ borderRadius: 2 }}>
                  {errorMessage}
                </Alert>
              )}

              {successMessage && (
                <Alert severity="success" className="mb-3" sx={{ borderRadius: 2 }}>
                  {successMessage}
                </Alert>
              )}

              <Box className="mb-4">
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
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Back to{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
