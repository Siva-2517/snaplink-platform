import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Alert, CircularProgress, Box, FormHelperText } from '@mui/material';

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = location.state?.email || '';
  const [email, setEmail] = useState(stateEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const otpRef = useRef(null);

  useEffect(() => {
    if (otpRef.current) {
      otpRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    if (!email || !otp || !newPassword) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setErrorMessage('Reset code must be a 6-digit number.');
      setSubmitting(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setSubmitting(false);
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Password must contain at least one letter and one number.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to connect to the server.');
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
              <h2>New Password</h2>
              <p>Create a secure new password for your SnapLink account.</p>
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
                  label="Reset Code (6 Digits)"
                  variant="outlined"
                  placeholder="123456"
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

              <Box className="mb-4">
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  variant="outlined"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitting}
                  required
                  size="small"
                  slotProps={{
                    input: {
                      style: { color: 'var(--text-heading)', background: 'var(--bg-input)' }
                    }
                  }}
                />
                <FormHelperText sx={{ color: 'var(--text-muted)' }}>
                  Password must be at least 6 characters, including a letter and a number.
                </FormHelperText>
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
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
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

export default ResetPasswordPage;
