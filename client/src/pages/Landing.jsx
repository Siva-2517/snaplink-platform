import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">
          <span>⚡ Redirection Engine v2.0</span>
        </div>
        <h1>Instant, Ultra-Optimized Link Management</h1>
        <p>
          Deploy sub-millisecond URL redirections backed by dual-mode Redis caching, 
          asynchronous write buffers, and secure protocol shielding.
        </p>
        <div className="landing-ctas">
          <Link to="/signup" className="btn btn-primary btn-large">
            Get Started Free
          </Link>
          <Link to="/login" className="btn btn-secondary btn-large">
            Login to Workspace
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats">
        <div className="landing-stat-card">
          <div className="landing-stat-val">&lt; 5ms</div>
          <div className="landing-stat-lbl">Redirect Latency</div>
          <div className="landing-stat-desc">Direct in-memory router bypasses standard database locks.</div>
        </div>
        <div className="landing-stat-card">
          <div className="landing-stat-val">99.99%</div>
          <div className="landing-stat-lbl">Cache Hit Ratio</div>
          <div className="landing-stat-desc">Synchronized dual-mode caching fallbacks keep routing active.</div>
        </div>
        <div className="landing-stat-card">
          <div className="landing-stat-val">100%</div>
          <div className="landing-stat-lbl">Protocol Shielding</div>
          <div className="landing-stat-desc">Proactive schema filtering blocks redirection loops.</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features-section">
        <div className="landing-features-header">
          <h2>Engineered for High-Performance Redirection</h2>
          <p>Explore the architecture driving sub-millisecond redial routing.</p>
        </div>

        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">⚡</div>
            <h3>Redirection Latency</h3>
            <p>
              Redirection requests bypass database locks completely for instant delivery, 
              logging clicks asynchronously in the background.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">📡</div>
            <h3>Dual-Mode Caching</h3>
            <p>
              Active routing mappings are synced to Redis with automated high-speed 
              in-memory JavaScript Map fallbacks if offline.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">🛡️</div>
            <h3>Protocol Shielding</h3>
            <p>
              Protects links by enforcing strict schema protocols and reserved keyword 
              blocks to avoid loops or loopbacks.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">📊</div>
            <h3>Interactive Analytics</h3>
            <p>
              Track visitor OS versions, device categories, browser client streams, 
              and generate clean physical QR codes.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="landing-cta-section">
        <h2>Ready to experience next-gen link management?</h2>
        <p>Join developers and SaaS operators optimizing their link structures today.</p>
        <Link to="/signup" className="btn btn-primary btn-large">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>&copy; {new Date().getFullYear()} SnapLink Platform. All rights reserved.</div>
        <div>
          Powered by <strong>Redis Cache</strong> &amp; <strong>Express Redirection</strong>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
