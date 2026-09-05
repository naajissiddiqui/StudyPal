import React, { useState } from 'react';
import { X, RotateCw } from 'lucide-react';
import type { TaskItem } from './TaskCard';
import { Spinner } from './ui/Spinner';

interface RescheduleModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: string, options: { mode: 'TOMORROW' | 'NEXT_SLOT' | 'CUSTOM_DATE'; targetDate?: string; targetStartTime?: string }) => Promise<void>;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [mode, setMode] = useState<'TOMORROW' | 'NEXT_SLOT' | 'CUSTOM_DATE'>('TOMORROW');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState('10:00');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(task._id, {
        mode,
        targetDate: mode === 'CUSTOM_DATE' ? customDate : undefined,
        targetStartTime: mode === 'CUSTOM_DATE' ? customTime : undefined
      });
      onClose();
    } catch (err) {
      console.error('Failed to reschedule:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCw size={18} color="#5448F8" />
            <h3 className="modal-title">Reschedule Study Task</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Current Task
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              {task.title}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              {task.subjectName} · {task.date} ({task.startTime} - {task.endTime})
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#1E293B', marginBottom: '10px' }}>
              Choose Rescheduling Strategy
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Tomorrow */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: mode === 'TOMORROW' ? '2px solid #5448F8' : '1px solid #E2E8F0',
                  background: mode === 'TOMORROW' ? '#F0EEFE' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="rescheduleMode"
                    checked={mode === 'TOMORROW'}
                    onChange={() => setMode('TOMORROW')}
                    style={{ accentColor: '#5448F8' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0F172A', display: 'block' }}>Reschedule to Tomorrow</strong>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Allocates to tomorrow's next free study block</span>
                  </div>
                </div>
              </label>

              {/* Option 2: Next available slot */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: mode === 'NEXT_SLOT' ? '2px solid #5448F8' : '1px solid #E2E8F0',
                  background: mode === 'NEXT_SLOT' ? '#F0EEFE' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="rescheduleMode"
                    checked={mode === 'NEXT_SLOT'}
                    onChange={() => setMode('NEXT_SLOT')}
                    style={{ accentColor: '#5448F8' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0F172A', display: 'block' }}>Next Available Slot Today</strong>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Pushes to the earliest unoccupied slot today</span>
                  </div>
                </div>
              </label>

              {/* Option 3: Custom Date & Time */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: mode === 'CUSTOM_DATE' ? '2px solid #5448F8' : '1px solid #E2E8F0',
                  background: mode === 'CUSTOM_DATE' ? '#F0EEFE' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="rescheduleMode"
                    checked={mode === 'CUSTOM_DATE'}
                    onChange={() => setMode('CUSTOM_DATE')}
                    style={{ accentColor: '#5448F8' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0F172A', display: 'block' }}>Pick Specific Date & Time</strong>
                    <span style={{ fontSize: '12.5px', color: '#64748B' }}>Manually choose when to tackle this topic</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {mode === 'CUSTOM_DATE' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Target Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-signin"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-get-started"
              style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" color="#FFFFFF" />
                  <span>Rescheduling...</span>
                </>
              ) : (
                <>
                  <RotateCw size={16} />
                  <span>Confirm Reschedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
