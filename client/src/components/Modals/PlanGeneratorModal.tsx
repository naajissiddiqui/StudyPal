import { useState } from 'react';
import { X, Sparkles, Clock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Spinner } from '../ui/Spinner';

interface PlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanGeneratorModal: React.FC<PlanGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [examName, setExamName] = useState('Final Semester Exams');
  const [targetDate, setTargetDate] = useState('2026-10-25');
  const [subjects, setSubjects] = useState('Data Structures, Operating Systems, Computer Networks');
  const [dailyHours, setDailyHours] = useState('3.5');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
      const baseUrl = import.meta.env.PROD
        ? (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1') ? '/api' : (envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`))
        : (envUrl ? (envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/+$/, '')}/api`) : '/api');

      // Call backend API
      const res = await fetch(`${baseUrl}/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName,
          targetDate,
          subjects: subjects.split(',').map(s => s.trim()),
          dailyHours: parseFloat(dailyHours)
        })
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedPlan(data.plan);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.log('Using client fallback generator', err);
      // Fallback in case server is not running
      setGeneratedPlan({
        examName,
        targetDate,
        subjects: subjects.split(',').map(s => s.trim()),
        studyStyle: 'Spaced Repetition & Active Recall',
        schedule: [
          {
            phase: 'Phase 1: High-Yield Concepts & Core Fundamentals',
            duration: 'Week 1 - 2',
            sessions: [
              { time: '09:00 - 10:30', task: 'Active Recall & Topic Summary Cards', tag: 'Deep Work' },
              { time: '11:00 - 12:00', task: 'Targeted Practice Problems', tag: 'Practice' },
              { time: '18:00 - 18:45', task: 'Spaced Repetition Quiz', tag: 'Review' }
            ]
          },
          {
            phase: 'Phase 2: Full Mocks & Weak Spot Elimination',
            duration: 'Final 10 Days',
            sessions: [
              { time: '09:00 - 12:00', task: 'Timed Mock Exam Simulation', tag: 'Exam Sim' },
              { time: '15:30 - 17:00', task: 'Error Log Deep Dive & Revision', tag: 'Review' }
            ]
          }
        ],
        aiRecommendations: [
          'Break study blocks into 50-minute focus sprints with 10-min active breaks.',
          'Review formula flashcards within 24 hours of first session.'
        ]
      });
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#5448F8" />
            <h3 className="modal-title">AI Study Plan Generator</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!generatedPlan ? (
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Exam or Goal Name
                </label>
                <input 
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. Midterms, MCAT, Semester Finals"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Target Exam Date
                  </label>
                  <input 
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Daily Study Hours
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    min="1"
                    max="14"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Subjects / Modules (comma-separated)
                </label>
                <input 
                  type="text"
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g. Mathematics, Organic Chemistry, Mechanics"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="btn-primary-cta"
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="#FFFFFF" />
                    <span>AI Engine Generating Optimal Plan...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Personalized Timetable</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#F0EEFE', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(84, 72, 248, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#1E293B' }}>{generatedPlan.examName}</h4>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#5448F8', background: '#FFFFFF', padding: '4px 12px', borderRadius: '999px' }}>
                    {generatedPlan.studyStyle}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  Target Date: {generatedPlan.targetDate} | Subjects: {generatedPlan.subjects?.join(', ')}
                </p>
              </div>

              <div>
                <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                  Generated Study Milestones
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {generatedPlan.schedule?.map((item: any, idx: number) => (
                    <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#0F172A' }}>{item.phase}</span>
                        <span style={{ fontSize: '12.5px', color: '#5448F8', fontWeight: 600 }}>{item.duration}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {item.sessions?.map((sess: any, sIdx: number) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', background: '#F8F9FE', padding: '6px 12px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Clock size={14} color="#64748B" />
                              <span style={{ fontWeight: 600, color: '#334155' }}>{sess.time}</span>
                              <span style={{ color: '#475569' }}>- {sess.task}</span>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, background: '#ECEBFE', color: '#5448F8', padding: '2px 8px', borderRadius: '6px' }}>
                              {sess.tag}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setGeneratedPlan(null)}
                  className="btn-signin"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Adjust Parameters
                </button>
                <button 
                  onClick={onClose}
                  className="btn-get-started"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save & Start Studying
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
