import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer-top">
        <div className="nav-brand">
          <div className="logo-badge">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="#5448F8" fillOpacity="0.1" />
              <path d="M18 7L6 14L18 21L30 14L18 7Z" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 16.5V23.5C10 23.5 13 27 18 27C23 27 26 23.5 26 23.5V16.5" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M30 14V22" stroke="#5448F8" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: '20px' }}>StudyPal</span>
        </div>

        <ul className="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#for-students">For Students</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#faqs">FAQs</a></li>
          <li><a href="#privacy">Privacy Policy</a></li>
          <li><a href="#terms">Terms of Service</a></li>
        </ul>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} StudyPal AI Study Planner. All rights reserved.</p>
        <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Crafted with <Heart size={14} fill="#EF4444" color="#EF4444" /> for ambitious students worldwide.
        </p>
      </div>
    </footer>
  );
};
