import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Spinner } from '../components/ui/Spinner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      login(res.accessToken, res.user);

      // Check if user has an active plan
      try {
        const planRes = await api.plans.getActivePlan();
        if (planRes.plan) {
          navigate('/dashboard');
        } else {
          navigate('/create-plan');
        }
      } catch {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      backgroundColor: '#F7F8FE'
    }}>
      {/* Background Orbs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '40px 36px',
        boxShadow: '0 20px 50px -15px rgba(84, 72, 248, 0.12), 0 4px 12px rgba(0,0,0,0.02)',
        border: '1px solid rgba(228, 233, 250, 0.9)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div className="logo-badge">
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="10" fill="#5448F8" fillOpacity="0.1" />
                <path d="M18 7L6 14L18 21L30 14L18 7Z" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 16.5V23.5C10 23.5 13 27 18 27C23 27 26 23.5 26 23.5V16.5" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M30 14V22" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>StudyPal</span>
          </Link>
          <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A', marginTop: '16px', letterSpacing: '-0.02em' }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
            Sign in to access your personalized daily study plan
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@university.edu"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14.5px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '14.5px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-cta"
            style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '14px 24px' }}
          >
            {loading ? (
              <>
                <Spinner size="sm" color="#FFFFFF" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to StudyPal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: '#5448F8', fontWeight: 700, textDecoration: 'none' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};
