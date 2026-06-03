import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyOtpPage = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Try to pre-fill email from redirect state
  const stateEmail = location.state?.email || '';
  const [email, setEmail] = useState(stateEmail);
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Rate-limiting resends: 60 seconds countdown
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRef = useRef(null);

  // Auto-focus OTP field
  useEffect(() => {
    if (otpRef.current) {
      otpRef.current.focus();
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown(prev => prev - 1);
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
        setResendCooldown(60); // 1 minute cooldown
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
    <div className="auth-page">
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
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: 'var(--error)',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.25rem'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: 'var(--success)',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.25rem'
            }}>
              ✓ {successMessage}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || !!stateEmail}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Verification Code (6 Digits)</label>
            <input 
              ref={otpRef}
              type="text" 
              maxLength="6"
              className="form-input" 
              placeholder="483921"
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em', fontWeight: 700 }}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={submitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }}></span>
                Verifying...
              </span>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {resendCooldown > 0 ? (
            <span>Resend code in <strong style={{ color: 'var(--text-heading)' }}>{resendCooldown}s</strong></span>
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
  );
};

export default VerifyOtpPage;
