import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Info, 
  RotateCw, 
  BookOpen, 
  FileText, 
  Brain, 
  Award 
} from 'lucide-react';
import { formatTime12h } from '../utils/timeUtils';

export interface TaskItem {
  _id: string;
  subjectName: string;
  topic: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'LEARNING' | 'PRACTICE' | 'REVISION' | 'MOCK_TEST';
  status: 'PENDING' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  plannedDuration: number;
  actualDuration?: number;
  completedAt?: string;
}

interface TaskCardProps {
  task: TaskItem;
  onComplete: (task: TaskItem) => void;
  onReschedule: (task: TaskItem) => void;
  onViewDetails: (task: TaskItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onReschedule,
  onViewDetails
}) => {
  const isCompleted = task.status === 'COMPLETED';
  const isRescheduled = task.status === 'RESCHEDULED';

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'LEARNING':
        return { label: 'Learning', icon: BookOpen, color: '#5448F8', bg: '#EEF0FF' };
      case 'PRACTICE':
        return { label: 'Practice', icon: FileText, color: '#059669', bg: '#ECFDF5' };
      case 'REVISION':
        return { label: 'Revision', icon: Brain, color: '#D97706', bg: '#FFFBEB' };
      case 'MOCK_TEST':
        return { label: 'Mock Test', icon: Award, color: '#DC2626', bg: '#FEF2F2' };
      default:
        return { label: type, icon: BookOpen, color: '#5448F8', bg: '#EEF0FF' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return { label: 'High Priority', color: '#DC2626', bg: '#FEF2F2' };
      case 'MEDIUM':
        return { label: 'Medium Priority', color: '#D97706', bg: '#FFFBEB' };
      case 'LOW':
        return { label: 'Low Priority', color: '#64748B', bg: '#F1F5F9' };
      default:
        return { label: priority, color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const typeInfo = getTypeBadge(task.type);
  const priorityInfo = getPriorityBadge(task.priority);
  const TypeIcon = typeInfo.icon;

  return (
    <div style={{
      background: isCompleted ? '#F8FAFC' : '#FFFFFF',
      borderRadius: '20px',
      border: isCompleted ? '1px solid #E2E8F0' : '1px solid rgba(228, 233, 250, 0.9)',
      padding: '20px 24px',
      boxShadow: isCompleted ? 'none' : '0 10px 30px -6px rgba(84, 72, 248, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      opacity: isCompleted ? 0.85 : 1
    }}>
      {/* Left: Complete Checkbox + Task Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
        <button
          onClick={() => !isCompleted && onComplete(task)}
          disabled={isCompleted}
          title={isCompleted ? 'Completed' : 'Mark as Complete'}
          style={{
            marginTop: '2px',
            background: 'none',
            border: 'none',
            cursor: isCompleted ? 'default' : 'pointer',
            color: isCompleted ? '#10B981' : '#CBD5E1',
            transition: 'color 0.2s'
          }}
        >
          {isCompleted ? (
            <CheckCircle2 size={24} fill="#10B981" color="#FFFFFF" />
          ) : (
            <Circle size={24} color="#94A3B8" />
          )}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {/* Top meta tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#334155',
              background: '#F1F5F9',
              padding: '2px 10px',
              borderRadius: '6px'
            }}>
              {task.subjectName}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: typeInfo.color,
              background: typeInfo.bg,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              <TypeIcon size={12} />
              <span>{typeInfo.label}</span>
            </span>

            <span style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: priorityInfo.color,
              background: priorityInfo.bg,
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {priorityInfo.label}
            </span>

            {isRescheduled && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#6366F1',
                background: '#EEF2FF',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                Rescheduled
              </span>
            )}
          </div>

          {/* Title & Topic */}
          <h4 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: isCompleted ? '#64748B' : '#0F172A',
            textDecoration: isCompleted ? 'line-through' : 'none',
            margin: 0
          }}>
            {task.title}
          </h4>

          {/* Time & Duration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} color="#818CF8" />
              <strong style={{ color: '#334155' }}>
                {formatTime12h(task.startTime)} — {formatTime12h(task.endTime)}
              </strong>
            </span>
            <span>({task.duration} mins)</span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => onViewDetails(task)}
          title="View Details & Study Guidance"
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Info size={15} />
          <span>Details</span>
        </button>

        {!isCompleted && (
          <button
            onClick={() => onReschedule(task)}
            title="Reschedule Task"
            style={{
              background: '#F0EEFE',
              border: '1px solid rgba(84, 72, 248, 0.15)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#5448F8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCw size={14} />
            <span>Reschedule</span>
          </button>
        )}

        {!isCompleted && (
          <button
            onClick={() => onComplete(task)}
            className="btn-primary-cta"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
};
