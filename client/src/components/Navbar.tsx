import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenGetStarted: () => void;
  onOpenSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGetStarted, onOpenSignIn }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar" id="navbar">
      <Link to="/" className="nav-brand">
        <div className="logo-badge">
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="#5448F8" fillOpacity="0.1" />
            <path d="M18 7L6 14L18 21L30 14L18 7Z" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 16.5V23.5C10 23.5 13 27 18 27C23 27 26 23.5 26 23.5V16.5" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M30 14V22" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        <span>StudyPal</span>
      </Link>

      <ul className="nav-links">
        <li><a href="#features" className="nav-link">Features</a></li>
        <li><a href="#how-it-works" className="nav-link">How It Works</a></li>
        <li><a href="#for-students" className="nav-link">For Students</a></li>
        <li><a href="#testimonials" className="nav-link">Testimonials</a></li>
        <li><a href="#faqs" className="nav-link">FAQs</a></li>
      </ul>

      <div className="nav-actions">
        {user ? (
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-get-started"
            id="nav-dashboard-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <>
            <button 
              onClick={onOpenSignIn}
              className="btn-signin"
              id="nav-signin-btn"
            >
              Sign In
            </button>
            <button 
              onClick={onOpenGetStarted}
              className="btn-get-started"
              id="nav-getstarted-btn"
            >
              Get Started
            </button>
          </>
        )}
        
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 100,
              border: '1px solid #ECEEF8'
            }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: '#1E293B', fontWeight: 600, padding: '8px 0' }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: '#1E293B', fontWeight: 600, padding: '8px 0' }}>How It Works</a>
            <a href="#for-students" onClick={() => setMobileMenuOpen(false)} style={{ color: '#1E293B', fontWeight: 600, padding: '8px 0' }}>For Students</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} style={{ color: '#1E293B', fontWeight: 600, padding: '8px 0' }}>Testimonials</a>
            <a href="#faqs" onClick={() => setMobileMenuOpen(false)} style={{ color: '#1E293B', fontWeight: 600, padding: '8px 0' }}>FAQs</a>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              {user ? (
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} 
                  className="btn-get-started" 
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button onClick={() => { setMobileMenuOpen(false); onOpenSignIn(); }} className="btn-signin" style={{ flex: 1 }}>Sign In</button>
                  <button onClick={() => { setMobileMenuOpen(false); onOpenGetStarted(); }} className="btn-get-started" style={{ flex: 1 }}>Get Started</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
