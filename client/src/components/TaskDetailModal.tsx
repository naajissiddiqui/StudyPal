import React, { useState } from 'react';
import { X, Clock, BookOpen, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { TaskItem } from './TaskCard';
import { formatTime12h } from '../utils/timeUtils';
import { api } from '../services/api';
import { Spinner } from './ui/Spinner';

interface TaskDetailModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, actualDuration?: number) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete
}) => {
  const [actualMinutes, setActualMinutes] = useState<string>(task ? String(task.plannedDuration) : '60');
  const [loading, setLoading] = useState(false);

  // AI Breakdown state
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState<any | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'COMPLETED';

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      await onComplete(task._id, actualMinutes ? parseInt(actualMinutes, 10) : task.plannedDuration);
      onClose();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchBreakdown = async () => {
    if (breakdown) {
      setShowBreakdown(!showBreakdown);
      return;
    }

    setLoadingBreakdown(true);
    try {
      const res = await api.ai.breakdownTask({
        subject: task.subjectName,
        topic: task.topic,
        duration: task.duration || task.plannedDuration || 60
      });

      if (res.success && res.data) {
        setBreakdown(res.data);
        setShowBreakdown(true);
      }
    } catch (err) {
      console.error('Error getting task breakdown:', err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#5448F8" />
            <h3 className="modal-title">Study Task Details</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Header Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#5448F8', background: '#ECEBFE', padding: '3px 10px', borderRadius: '6px' }}>
                {task.subjectName}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', background: '#F1F5F9', padding: '3px 10px', borderRadius: '6px' }}>
                {task.type}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#D97706', background: '#FFFBEB', padding: '3px 10px', borderRadius: '6px' }}>
                {task.priority} Priority
              </span>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
              {task.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13.5px', color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#5448F8" />
                <strong>{task.date}</strong> ({formatTime12h(task.startTime)} - {formatTime12h(task.endTime)})
              </span>
              <span>Planned: {task.plannedDuration} mins</span>
            </div>
          </div>

          {/* AI Guidance / Instructions Box */}
          <div style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
            borderRadius: '16px',
            padding: '18px',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#5448F8' }}>
                <Sparkles size={16} />
                <span>AI Study Guidance</span>
              </div>
              <button
                type="button"
                onClick={handleFetchBreakdown}
                disabled={loadingBreakdown}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5448F8',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                {loadingBreakdown ? (
                  <Spinner size="xs" color="#5448F8" />
                ) : (
                  <>
                    <span>{showBreakdown ? 'Hide Step Breakdown' : '✨ AI Action Plan'}</span>
                    {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </>
                )}
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
              {task.description || `Focus on active mastery of ${task.topic}. Solve foundational problems and verify key concepts.`}
            </p>

            {/* AI Breakdown accordion */}
            {showBreakdown && breakdown && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #CBD5E1' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E1B4B', marginBottom: '8px' }}>
                  🧠 Recommended Strategy: {breakdown.strategy}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {breakdown.steps.map((st: any, i: number) => (
                    <div key={i} style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#5448F8' }}>{st.phase}</div>
                      <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>{st.action}</div>
                      {st.deliverable && (
                        <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                          🎯 Deliverable: {st.deliverable}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actual Study Duration Logger */}
          {!isCompleted && (
            <div>
              <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Actual Study Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14.5px',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-signin"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Close
            </button>

            {!isCompleted ? (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={loading}
                className="btn-get-started"
                style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="#FFFFFF" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Mark as Completed</span>
                  </>
                )}
              </button>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#059669',
                fontWeight: 700,
                fontSize: '14px',
                background: '#ECFDF5',
                borderRadius: '999px',
                padding: '10px'
              }}>
                <CheckCircle2 size={18} />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
