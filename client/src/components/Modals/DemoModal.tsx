import React from 'react';
import { X, Play, Sparkles, CheckCircle2 } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryNow: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onTryNow }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#5448F8" />
            <h3 className="modal-title">StudyPal Interactive Tour</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Mock Video Player */}
          <div 
            style={{ 
              width: '100%', 
              height: '320px', 
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', 
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              position: 'relative',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
              marginBottom: '24px'
            }}
          >
            <div 
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#5448F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(84, 72, 248, 0.6)',
                cursor: 'pointer',
                marginBottom: '14px',
                transition: 'transform 0.2s'
              }}
            >
              <Play size={28} fill="#FFFFFF" style={{ marginLeft: '4px' }} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 700 }}>Watch How AI Calculates Your Timetable</h4>
            <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>2-minute interactive workflow breakdown</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
              <CheckCircle2 size={16} color="#5448F8" />
              <span>Smart exam priority weighting</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
              <CheckCircle2 size={16} color="#5448F8" />
              <span>Auto-adapts when schedule changes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
              <CheckCircle2 size={16} color="#5448F8" />
              <span>Spaced repetition memory algorithms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
              <CheckCircle2 size={16} color="#5448F8" />
              <span>Zero-friction daily progress tracker</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              className="btn-signin"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Close
            </button>
            <button 
              onClick={() => { onClose(); onTryNow(); }}
              className="btn-get-started"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Try AI Plan Generator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
