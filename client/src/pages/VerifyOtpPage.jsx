import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Alert, CircularProgress, Box } from '@mui/material';

const VerifyOtpPage = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = location.state?.email || '';
  const [email, setEmail] = useState(stateEmail);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRef = useRef(null);

  useEffect(() => {
    if (otpRef.current) {
      otpRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    if (!email || !otp) {
      setErrorMessage('Please enter both email and verification code.');
      setSubmitting(false);
      return;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setErrorMessage('Verification code must be a 6-digit number.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to connect to the verification server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage('');
    setSuccessMessage('');
    setResending(true);

    try {
      const res = await resendOtp(email);
      if (res.success) {
        setSuccessMessage(res.message);
        setResendCooldown(60);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to resend verification code.');
    } finally {
      setResending(false);
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
              <h2>Verify Account</h2>
              <p>Please enter the 6-digit verification code sent to your email.</p>
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

              <Box className="mb-3">
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || !!stateEmail}
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
                <TextField
                  inputRef={otpRef}
                  fullWidth
                  label="Verification Code (6 Digits)"
                  variant="outlined"
                  placeholder="483921"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={submitting}
                  required
                  size="small"
                  slotProps={{
                    htmlInput: {
                      maxLength: 6,
                      style: { textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.2em', fontWeight: 700, color: 'var(--text-heading)', background: 'var(--bg-input)' }
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
                  mb: 2,
                  bgcolor: 'var(--primary)',
                  '&:hover': { bgcolor: 'var(--primary-hover)' },
                  fontWeight: 600,
                  boxShadow: '0 4px 14px 0 var(--primary-glow)'
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Verify Account'}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {resendCooldown > 0 ? (
                <span>
                  Resend code in <strong style={{ color: 'var(--text-heading)' }}>{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending || !email}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {resending ? 'Sending...' : 'Resend Verification Code'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
