import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  RotateCw, 
  Sparkles, 
  ArrowLeft,
  CalendarDays,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { AppNavbar } from '../components/AppNavbar';
import type { TaskItem } from '../components/TaskCard';
import { RescheduleModal } from '../components/RescheduleModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { formatTime12h, getStartOfWeek, addDays, formatDateShort } from '../utils/timeUtils';
import { Spinner } from '../components/ui/Spinner';

export const WeeklyPlanPage: React.FC = () => {
  // Current Monday of the viewed week
  const [currentWeekMonday, setCurrentWeekMonday] = useState<string>(() => {
    return getStartOfWeek(new Date().toISOString().split('T')[0]);
  });

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modals state
  const [rescheduleTask, setRescheduleTask] = useState<TaskItem | null>(null);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);

  // Fetch weekly tasks
  const fetchWeeklyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.tasks.getWeeklyTasks(currentWeekMonday);
      if (res.success) {
        setTasks(res.tasks || []);
      }
    } catch (err: any) {
      console.error('Error fetching weekly tasks:', err);
      setError(err.message || 'Failed to load weekly schedule');
    } finally {
      setLoading(false);
    }
  }, [currentWeekMonday]);

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Week navigation
  const handlePrevWeek = () => {
    setCurrentWeekMonday(addDays(currentWeekMonday, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekMonday(addDays(currentWeekMonday, 7));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getStartOfWeek(new Date().toISOString().split('T')[0]));
  };

  // 7 days of the current week (Monday to Sunday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(currentWeekMonday, i);
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    return {
      dateStr,
      dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      formattedDate: formatDateShort(dateStr),
      isToday
    };
  });

  // Handle task completion
  const handleToggleComplete = async (task: TaskItem) => {
    try {
      const res = await api.tasks.completeTask(task._id, task.duration);
      if (res.success) {
        setTasks(tasks.map(t => t._id === task._id ? res.task : t));
      }
    } catch (err: any) {
      alert('Error completing task: ' + err.message);
    }
  };

  // Handle task reschedule confirm
  const handleRescheduleConfirm = async (
    taskId: string,
    options: { mode: 'TOMORROW' | 'NEXT_SLOT' | 'CUSTOM_DATE'; targetDate?: string; targetStartTime?: string }
  ) => {
    try {
      const res = await api.tasks.rescheduleTask(taskId, options);
      if (res.success) {
        await fetchWeeklyData();
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (selectedSubject !== 'ALL' && t.subjectName !== selectedSubject) return false;
    if (selectedType !== 'ALL' && t.type !== selectedType) return false;
    return true;
  });

  // Extract unique subjects for filter dropdown
  const subjectList = Array.from(new Set(tasks.map(t => t.subjectName))).filter(Boolean);

  // Group filtered tasks by date
  const tasksByDate = weekDays.reduce((acc, day) => {
    acc[day.dateStr] = filteredTasks
      .filter(t => t.date === day.dateStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    return acc;
  }, {} as Record<string, TaskItem[]>);

  // Stats for the week
  const totalWeekTasks = filteredTasks.length;
  const completedWeekTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const totalWeekMinutes = filteredTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

  const getTypeBadgeInfo = (type: string) => {
    switch (type) {
      case 'LEARNING':
        return { label: 'Learn', bg: '#EEF0FF', color: '#5448F8' };
      case 'PRACTICE':
        return { label: 'Practice', bg: '#ECFDF5', color: '#059669' };
      case 'REVISION':
        return { label: 'Revision', bg: '#FFFBEB', color: '#D97706' };
      case 'MOCK_TEST':
        return { label: 'Mock Test', bg: '#FEF2F2', color: '#DC2626' };
      default:
        return { label: type, bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F7F8FE 0%, #FFFFFF 100%)' }}>
      <AppNavbar />

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Top Header */}
        <section style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px', 
          marginBottom: '28px' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Link 
                to="/dashboard" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: '#64748B', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  textDecoration: 'none' 
                }}
              >
                <ArrowLeft size={14} /> Back to Today
              </Link>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
              Weekly Study Timetable 📅
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
              Structured, conflict-free view across all days with automatic subject load balancing.
            </p>
          </div>

          {/* Quick Summary Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            padding: '10px 18px',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Weekly Load</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E1B4B' }}>
                {completedWeekTasks}/{totalWeekTasks} Completed ({(totalWeekMinutes / 60).toFixed(1)} hrs)
              </div>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: '#EEF0FF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CalendarDays size={18} color="#5448F8" />
            </div>
          </div>
        </section>

        {/* Toolbar: Week Switcher & Filters */}
        <section style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          {/* Week Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '10px', padding: '4px' }}>
              <button 
                onClick={handlePrevWeek} 
                style={{ background: 'none', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                title="Previous Week"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={handleCurrentWeek}
                style={{
                  background: currentWeekMonday === getStartOfWeek(new Date().toISOString().split('T')[0]) ? '#5448F8' : 'none',
                  color: currentWeekMonday === getStartOfWeek(new Date().toISOString().split('T')[0]) ? '#FFFFFF' : '#475569',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Current Week
              </button>
              <button 
                onClick={handleNextWeek} 
                style={{ background: 'none', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                title="Next Week"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E1B4B' }}>
              {formatDateShort(currentWeekMonday)} – {formatDateShort(addDays(currentWeekMonday, 6))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Subject Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Subject:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1E293B',
                  background: '#F8FAFC',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Subjects</option>
                {subjectList.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1E293B',
                  background: '#F8FAFC',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Types</option>
                <option value="LEARNING">Learning</option>
                <option value="PRACTICE">Practice</option>
                <option value="REVISION">Revision</option>
                <option value="MOCK_TEST">Mock Test</option>
              </select>
            </div>
          </div>
        </section>

        {/* 7-Day Timetable Grid */}
        {loading ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Spinner size="lg" color="#5448F8" />
            <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500 }}>Organizing your weekly curriculum...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#DC2626' }}>
            <p style={{ fontWeight: 600 }}>{error}</p>
            <button onClick={fetchWeeklyData} className="btn btn-secondary" style={{ marginTop: '12px', fontSize: '13px' }}>Retry</button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            alignItems: 'start'
          }}>
            {weekDays.map((day) => {
              const dayTasks = tasksByDate[day.dateStr] || [];
              const dayMinutes = dayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

              return (
                <div
                  key={day.dateStr}
                  style={{
                    background: day.isToday ? '#FBFBFF' : '#FFFFFF',
                    borderRadius: '16px',
                    border: day.isToday ? '2px solid #5448F8' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: day.isToday ? '0 8px 24px rgba(84, 72, 248, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '480px'
                  }}
                >
                  {/* Day Column Header */}
                  <div style={{
                    padding: '14px 16px',
                    background: day.isToday ? 'linear-gradient(135deg, #5448F8 0%, #6366F1 100%)' : '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: day.isToday ? '#FFFFFF' : '#1E293B'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {day.dayName}
                      </span>
                      {day.isToday && (
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          background: 'rgba(255,255,255,0.25)', 
                          padding: '2px 6px', 
                          borderRadius: '100px',
                          textTransform: 'uppercase'
                        }}>
                          Today
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', opacity: day.isToday ? 0.9 : 0.6, marginTop: '2px' }}>
                      {day.formattedDate}
                    </div>

                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: day.isToday ? '#E0E7FF' : '#64748B',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}</span>
                      <span>{(dayMinutes / 60).toFixed(1)} hrs</span>
                    </div>
                  </div>

                  {/* Tasks Container */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                    {dayTasks.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 10px', 
                        color: '#94A3B8', 
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%'
                      }}>
                        <Sparkles size={20} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                        <span>Rest / Free Day</span>
                      </div>
                    ) : (
                      dayTasks.map((t) => {
                        const isDone = t.status === 'COMPLETED';
                        const typeInfo = getTypeBadgeInfo(t.type);

                        return (
                          <div
                            key={t._id}
                            style={{
                              background: isDone ? '#F8FAFC' : '#FFFFFF',
                              border: isDone ? '1px solid #E2E8F0' : '1px solid #E2E8F0',
                              borderRadius: '12px',
                              padding: '12px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              opacity: isDone ? 0.75 : 1,
                              transition: 'all 0.15s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => setDetailTask(t)}
                          >
                            {/* Subject & Type Badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 700, 
                                color: '#1E1B4B',
                                background: '#F1F5F9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                maxWidth: '90px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {t.subjectName}
                              </span>

                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                background: typeInfo.bg,
                                color: typeInfo.color,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {typeInfo.label}
                              </span>
                            </div>

                            {/* Task Title / Topic */}
                            <h4 style={{ 
                              fontSize: '12px', 
                              fontWeight: 700, 
                              color: isDone ? '#64748B' : '#1E293B', 
                              margin: '0 0 6px 0',
                              lineHeight: '1.3',
                              textDecoration: isDone ? 'line-through' : 'none'
                            }}>
                              {t.topic}
                            </h4>

                            {/* Time Slot & Quick Actions */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginTop: '8px', 
                              paddingTop: '6px', 
                              borderTop: '1px solid #F1F5F9',
                              fontSize: '11px',
                              color: '#64748B'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} />
                                {formatTime12h(t.startTime)}
                              </span>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                {/* Reschedule trigger */}
                                <button
                                  onClick={() => setRescheduleTask(t)}
                                  title="Reschedule session"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748B',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <RotateCw size={12} />
                                </button>

                                {/* Complete toggle */}
                                <button
                                  onClick={() => handleToggleComplete(t)}
                                  title={isDone ? 'Mark as pending' : 'Mark as complete'}
                                  style={{
                                    background: isDone ? '#059669' : '#FFFFFF',
                                    border: isDone ? 'none' : '1px solid #CBD5E1',
                                    color: isDone ? '#FFFFFF' : 'transparent',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isDone && <Check size={12} strokeWidth={3} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reschedule Modal */}
      <RescheduleModal
        task={rescheduleTask}
        isOpen={!!rescheduleTask}
        onClose={() => setRescheduleTask(null)}
        onConfirm={handleRescheduleConfirm}
      />

      {/* Task Details Modal */}
      <TaskDetailModal
        task={detailTask}
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        onComplete={async (taskId: string, duration?: number) => {
          const found = tasks.find(t => t._id === taskId);
          if (found) {
            await handleToggleComplete({ ...found, duration: duration || found.duration });
          }
          setDetailTask(null);
        }}
      />
    </div>
  );
};
