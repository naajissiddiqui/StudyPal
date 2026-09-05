import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Sparkles, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp,
  Award,
  CalendarDays,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AppNavbar } from '../components/AppNavbar';
import { TaskCard } from '../components/TaskCard';
import type { TaskItem } from '../components/TaskCard';
import { RescheduleModal } from '../components/RescheduleModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { AskStudyPalModal } from '../components/AskStudyPalModal';
import { formatDateDisplay } from '../utils/timeUtils';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    missed: 0,
    progressPercentage: 0
  });

  // Modals state
  const [rescheduleTask, setRescheduleTask] = useState<TaskItem | null>(null);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Fetch today's tasks and active plan
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch active plan
      try {
        const planRes = await api.plans.getActivePlan();
        if (planRes.success) {
          setActivePlan(planRes.plan);
        }
      } catch (err) {
        console.warn('No active plan found or error fetching active plan:', err);
      }

      // 2. Fetch tasks for selected date
      const taskRes = await api.tasks.getTodayTasks(selectedDate);
      if (taskRes.success) {
        setTasks(taskRes.tasks || []);
        setMetrics(taskRes.metrics || {
          total: taskRes.tasks?.length || 0,
          completed: taskRes.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0,
          pending: taskRes.tasks?.filter((t: any) => t.status === 'PENDING').length || 0,
          missed: 0,
          progressPercentage: 0
        });
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load study tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle task completion toggle
  const handleToggleComplete = async (task: TaskItem) => {
    try {
      const res = await api.tasks.completeTask(task._id, task.duration);
      if (res.success) {
        const updatedTask = res.task;
        const newTasks = tasks.map(t => t._id === task._id ? updatedTask : t);
        setTasks(newTasks);

        // Recalculate metrics
        const completedCount = newTasks.filter(t => t.status === 'COMPLETED').length;
        const totalCount = newTasks.length;
        const newPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        setMetrics({
          ...metrics,
          completed: completedCount,
          pending: totalCount - completedCount,
          progressPercentage: newPercentage
        });

        // Trigger confetti celebration
        if (newPercentage === 100) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err: any) {
      alert('Error updating task: ' + err.message);
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
        // Refresh dashboard data
        await fetchData();
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Date navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING') return t.status === 'PENDING';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  // Total planned study time for the day in minutes
  const totalPlannedMinutes = tasks.reduce((sum, t) => sum + (t.duration || t.plannedDuration || 0), 0);
  const completedMinutes = tasks.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + (t.duration || t.plannedDuration || 0), 0);

  // Calculate upcoming exams
  const upcomingExams = activePlan?.subjects
    ?.filter((s: any) => s.examDate && new Date(s.examDate) >= new Date())
    ?.map((s: any) => {
      const diffTime = new Date(s.examDate).getTime() - new Date().setHours(0,0,0,0);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        name: s.name,
        examDate: s.examDate,
        diffDays
      };
    })
    ?.sort((a: any, b: any) => a.diffDays - b.diffDays) || [];

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F7F8FE 0%, #FFFFFF 100%)' }}>
      <AppNavbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Welcome Header */}
        <section style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap', 
          gap: '20px', 
          marginBottom: '32px' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#5448F8', 
                background: '#EEF0FF', 
                padding: '4px 10px', 
                borderRadius: '100px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={12} /> AI Adaptive Planner
              </span>
              {activePlan && (
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#059669', 
                  background: '#ECFDF5', 
                  padding: '4px 10px', 
                  borderRadius: '100px' 
                }}>
                  {activePlan.title || 'Targeted Exam Plan'}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Scholar'}! 🎯
            </h1>
            <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>
              {isToday ? "Here is your personalized schedule tailored for today's highest yield topics." : `Showing schedule for ${formatDateDisplay(selectedDate)}.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link 
              to="/plan" 
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#1E293B',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <CalendarDays size={16} color="#5448F8" />
              Weekly Schedule
            </Link>

            <button
              type="button"
              onClick={() => setIsAssistantOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #5448F8 0%, #7C3AED 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(84, 72, 248, 0.25)'
              }}
            >
              <Bot size={17} />
              <span>Ask StudyPal 🤖</span>
            </button>

            <Link 
              to="/create-plan" 
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: '10px',
                textDecoration: 'none'
              }}
            >
              <PlusCircle size={16} />
              {activePlan ? 'Update Plan' : 'Create New Plan'}
            </Link>
          </div>
        </section>

        {/* Metrics & Highlights Grid */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '20px', 
          marginBottom: '36px' 
        }}>
          {/* Card 1: Today's Completion */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(84, 72, 248, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Daily Goal Progress</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E1B4B', marginTop: '4px' }}>
                  {metrics.completed} / {metrics.total}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginLeft: '6px' }}>tasks</span>
                </div>
              </div>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '12px', 
                background: '#EEF0FF', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <CheckCircle2 size={22} color="#5448F8" />
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                <span>Completion Rate</span>
                <span>{metrics.progressPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${metrics.progressPercentage}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #5448F8 0%, #818CF8 100%)', 
                  borderRadius: '100px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Card 2: Study Time Target */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(84, 72, 248, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Scheduled Study Time</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E1B4B', marginTop: '4px' }}>
                  {(completedMinutes / 60).toFixed(1)} / {(totalPlannedMinutes / 60).toFixed(1)}
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginLeft: '6px' }}>hrs</span>
                </div>
              </div>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '12px', 
                background: '#ECFDF5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Clock size={22} color="#059669" />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="#059669" />
              <span>{Math.max(0, totalPlannedMinutes - completedMinutes)} mins remaining today</span>
            </div>
          </div>

          {/* Card 3: Momentum & Streak */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(84, 72, 248, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Active Streak</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E1B4B', marginTop: '4px' }}>
                  {user?.streak || 1} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginLeft: '2px' }}>days active</span>
                </div>
              </div>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '12px', 
                background: '#FFFBEB', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Flame size={22} color="#D97706" />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 500 }}>
              ⚡ Keep studying consistently to retain 85%+ knowledge.
            </div>
          </div>

          {/* Card 4: Next Target Exam Countdown */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(84, 72, 248, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Target Exam Horizon</span>
                {upcomingExams.length > 0 ? (
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', marginTop: '4px' }}>
                    {upcomingExams[0].diffDays} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748B' }}>days left</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#1E1B4B', marginTop: '8px' }}>
                    No Exam Set
                  </div>
                )}
              </div>
              <div style={{ 
                width: '44px', 
                height: '44px', 
                borderRadius: '12px', 
                background: '#FEF2F2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Award size={22} color="#DC2626" />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {upcomingExams.length > 0 ? (
                <span>Next up: <strong>{upcomingExams[0].name}</strong></span>
              ) : (
                <span>Set exam dates in your study plan.</span>
              )}
            </div>
          </div>
        </section>

        {/* Schedule & Task Management Section */}
        <section style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '28px',
          boxShadow: '0 4px 25px rgba(0,0,0,0.03)'
        }}>
          {/* Header with Date Navigator and Filters */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '1px solid #F1F5F9'
          }}>
            {/* Date Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', borderRadius: '10px', padding: '4px' }}>
                <button 
                  onClick={handlePrevDay} 
                  style={{ background: 'none', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                  title="Previous Day"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={handleToday}
                  style={{
                    background: isToday ? '#5448F8' : 'none',
                    color: isToday ? '#FFFFFF' : '#475569',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Today
                </button>
                <button 
                  onClick={handleNextDay} 
                  style={{ background: 'none', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}
                  title="Next Day"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
                  {formatDateDisplay(selectedDate)}
                </h2>
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', background: '#F8FAFC', padding: '4px', borderRadius: '10px' }}>
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: filter === f ? '#FFFFFF' : 'transparent',
                    color: filter === f ? '#5448F8' : '#64748B',
                    boxShadow: filter === f ? '0 2px 4px rgba(0,0,0,0.04)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f === 'ALL' ? `All (${tasks.length})` : f === 'PENDING' ? `Pending (${metrics.pending})` : `Done (${metrics.completed})`}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #EEF0FF', borderTopColor: '#5448F8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 500 }}>Loading your optimized schedule...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#DC2626' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600 }}>{error}</p>
              <button 
                onClick={fetchData} 
                className="btn btn-secondary" 
                style={{ marginTop: '12px', fontSize: '13px', padding: '8px 16px' }}
              >
                Try Again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ 
              padding: '60px 20px', 
              textAlign: 'center', 
              background: '#F8FAFC', 
              borderRadius: '16px',
              border: '1px dashed #CBD5E1'
            }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: '50%', 
                background: '#EEF0FF', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '16px' 
              }}>
                <BookOpen size={26} color="#5448F8" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E1B4B', margin: '0 0 6px 0' }}>
                {filter === 'ALL' 
                  ? 'No study sessions scheduled for this day' 
                  : filter === 'PENDING' 
                  ? 'All tasks completed for this day! 🎉' 
                  : 'No completed tasks yet'}
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', maxWidth: '420px', margin: '0 auto 20px' }}>
                {activePlan 
                  ? 'Take a well-deserved rest or review your upcoming weekly schedule.' 
                  : 'Create your personalized multi-subject study plan to get started with daily AI scheduling.'}
              </p>
              
              {!activePlan && (
                <Link to="/create-plan" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> Create Your Study Plan
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={handleToggleComplete}
                  onReschedule={(t) => setRescheduleTask(t)}
                  onViewDetails={(t) => setDetailTask(t)}
                />
              ))}
            </div>
          )}
        </section>
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

      {/* Floating AI Assistant Action Trigger */}
      <button
        type="button"
        onClick={() => setIsAssistantOpen(true)}
        title="Ask StudyPal AI Assistant"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: 'linear-gradient(135deg, #5448F8 0%, #7C3AED 100%)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '999px',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14.5px',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(84, 72, 248, 0.45)',
          zIndex: 90,
          transition: 'all 0.2s ease'
        }}
      >
        <Bot size={20} />
        <span>Ask StudyPal AI</span>
        <Sparkles size={14} color="#A7F3D0" />
      </button>

      {/* Contextual Ask StudyPal AI Assistant Modal */}
      <AskStudyPalModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        planId={activePlan?._id}
      />
    </div>
  );
};
