import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { login, signup } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSubmitting(true);

    // Frontend validations
    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setSubmitting(false);
      return;
    }

    if (!isLoginTab && !username) {
      setErrorMessage('Username is required for registration.');
      setSubmitting(false);
      return;
    }

    try {
      if (isLoginTab) {
        // Handle Login
        const res = await login(email, password);
        if (res.success) {
          setSuccessMessage(res.message);
        } else {
          setErrorMessage(res.message);
        }
      } else {
        // Handle Signup
        const res = await signup(username, email, password);
        if (res.success) {
          setSuccessMessage(res.message);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch {
      setErrorMessage('An unexpected connection error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-logo" style={{ justifyContent: 'center', marginBottom: '1rem', cursor: 'default' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>SnapLink</span>
          </div>
          <h2>{isLoginTab ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLoginTab ? 'Sleek. Optimized. Instant URL Analytics' : 'Scale your reach with advanced caching redirects'}</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(true);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            disabled={submitting}
          >
            Login
          </button>
          <button 
            className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(false);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            disabled={submitting}
          >
            Register
          </button>
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

          {!isLoginTab && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. dev_genius"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                required
              />
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
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.8rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }}></span>
                Processing...
              </span>
            ) : (
              isLoginTab ? 'Access Dashboard' : 'Sign Up Free'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Landing;
