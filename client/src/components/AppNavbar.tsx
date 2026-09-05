import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-navbar" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div className="logo-badge">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="#5448F8" fillOpacity="0.1" />
              <path d="M18 7L6 14L18 21L30 14L18 7Z" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 16.5V23.5C10 23.5 13 27 18 27C23 27 26 23.5 26 23.5V16.5" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M30 14V22" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '21px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>StudyPal</span>
        </Link>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              background: isActive('/dashboard') ? '#ECEBFE' : 'transparent',
              color: isActive('/dashboard') ? '#5448F8' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            <CheckSquare size={16} />
            <span>Today's Plan</span>
          </Link>

          <Link
            to="/plan"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              background: isActive('/plan') ? '#ECEBFE' : 'transparent',
              color: isActive('/plan') ? '#5448F8' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={16} />
            <span>Weekly Schedule</span>
          </Link>

          <Link
            to="/create-plan"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              background: isActive('/create-plan') ? '#5448F8' : 'transparent',
              color: isActive('/create-plan') ? '#FFFFFF' : '#475569',
              border: isActive('/create-plan') ? 'none' : '1px dashed #CBD5E1',
              transition: 'all 0.2s'
            }}
          >
            <PlusCircle size={16} />
            <span>New Plan</span>
          </Link>
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5345F8 0%, #6D5FF7 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                {user?.name || 'Student'}
              </span>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '8px',
              borderRadius: '10px',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
