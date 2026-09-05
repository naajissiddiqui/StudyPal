import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'getstarted';
  onClose: () => void;
  onSwitchMode: (mode: 'signin' | 'getstarted') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#5448F8" />
            <h3 className="modal-title">
              {mode === 'signin' ? 'Sign In to StudyPal' : 'Get Started with StudyPal'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                {mode === 'signin' ? 'Welcome Back!' : 'Account Created!'}
              </h4>
              <p style={{ fontSize: '14px', color: '#64748B' }}>
                Redirecting you to your personalized study workspace...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'getstarted' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Patel"
                      required
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
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
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

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
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
                className="btn-primary-cta"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              >
                <span>{mode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13.5px', color: '#64748B' }}>
                {mode === 'signin' ? (
                  <p>
                    Don't have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => onSwitchMode('getstarted')}
                      style={{ color: '#5448F8', fontWeight: 600 }}
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => onSwitchMode('signin')}
                      style={{ color: '#5448F8', fontWeight: 600 }}
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
