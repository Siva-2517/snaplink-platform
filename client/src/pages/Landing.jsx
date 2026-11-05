import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '@mui/material';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page container py-4">
      {/* Hero Section */}
      <section className="landing-hero text-center py-5">
        <div className="hero-badge mb-3 d-inline-block">
          <span>⚡ Redirection Engine v2.0</span>
        </div>
        <h1 className="mb-3">Instant, Ultra-Optimized Link Management</h1>
        <p className="mx-auto mb-4" style={{ maxWidth: 680 }}>
          Deploy sub-millisecond URL redirections backed by dual-mode Redis caching,
          asynchronous write buffers, and secure protocol shielding.
        </p>
        <div className="landing-ctas d-flex justify-content-center gap-3">
          <Button
            component={Link}
            to="/signup"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'var(--primary)',
              '&:hover': { bgcolor: 'var(--primary-hover)' },
              px: 4,
              py: 1.2,
              fontWeight: 600,
              boxShadow: '0 4px 14px 0 var(--primary-glow)'
            }}
          >
            Get Started Free
          </Button>
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            size="large"
            color="inherit"
            sx={{ px: 4, py: 1.2, fontWeight: 600 }}
          >
            Login to Workspace
          </Button>
        </div>
      </section>

      {/* Stats Section with Bootstrap grid */}
      <section className="landing-stats row g-4 py-4">
        <div className="col-12 col-md-4">
          <Card className="landing-stat-card h-100 p-4 text-center" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <div className="landing-stat-val">&lt; 5ms</div>
            <div className="landing-stat-lbl">Redirect Latency</div>
            <div className="landing-stat-desc">Direct in-memory router bypasses standard database locks.</div>
          </Card>
        </div>
        <div className="col-12 col-md-4">
          <Card className="landing-stat-card h-100 p-4 text-center" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <div className="landing-stat-val">99.99%</div>
            <div className="landing-stat-lbl">Cache Hit Ratio</div>
            <div className="landing-stat-desc">Synchronized dual-mode caching fallbacks keep routing active.</div>
          </Card>
        </div>
        <div className="col-12 col-md-4">
          <Card className="landing-stat-card h-100 p-4 text-center" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <div className="landing-stat-val">100%</div>
            <div className="landing-stat-lbl">Protocol Shielding</div>
            <div className="landing-stat-desc">Proactive schema filtering blocks redirection loops.</div>
          </Card>
        </div>
      </section>

      {/* Features Section with Bootstrap grid */}
      <section className="landing-features-section py-5">
        <div className="landing-features-header text-center mb-5">
          <h2>Engineered for High-Performance Redirection</h2>
          <p>Explore the architecture driving sub-millisecond redial routing.</p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-6 col-lg-3">
            <Card className="landing-feature-card h-100 p-4" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <div className="landing-feature-icon fs-2 mb-2">⚡</div>
              <h3>Redirection Latency</h3>
              <p>
                Redirection requests bypass database locks completely for instant delivery,
                logging clicks asynchronously in the background.
              </p>
            </Card>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <Card className="landing-feature-card h-100 p-4" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <div className="landing-feature-icon fs-2 mb-2">📡</div>
              <h3>Dual-Mode Caching</h3>
              <p>
                Active routing mappings are synced to Redis with automated high-speed
                in-memory JavaScript Map fallbacks if offline.
              </p>
            </Card>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <Card className="landing-feature-card h-100 p-4" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <div className="landing-feature-icon fs-2 mb-2">🛡️</div>
              <h3>Protocol Shielding</h3>
              <p>
                Protects links by enforcing strict schema protocols and reserved keyword
                blocks to avoid loops or loopbacks.
              </p>
            </Card>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <Card className="landing-feature-card h-100 p-4" sx={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <div className="landing-feature-icon fs-2 mb-2">📊</div>
              <h3>Interactive Analytics</h3>
              <p>
                Track visitor OS versions, device categories, browser client streams,
                and generate clean physical QR codes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="landing-cta-section text-center py-5 my-4">
        <h2 className="mb-3">Ready to experience next-gen link management?</h2>
        <p className="mb-4">Join developers and SaaS operators optimizing their link structures today.</p>
        <Button
          component={Link}
          to="/signup"
          variant="contained"
          size="large"
          sx={{
            bgcolor: 'var(--primary)',
            '&:hover': { bgcolor: 'var(--primary-hover)' },
            px: 4,
            py: 1.2,
            fontWeight: 600
          }}
        >
          Create Free Account
        </Button>
      </section>

      {/* Footer */}
      <footer className="landing-footer border-top pt-4 text-center d-flex flex-column flex-sm-row justify-content-between gap-2">
        <div>&copy; {new Date().getFullYear()} SnapLink Platform. All rights reserved.</div>
        <div>
          Powered by <strong>Redis Cache</strong> &amp; <strong>Express Redirection</strong>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
