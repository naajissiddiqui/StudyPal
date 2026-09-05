import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AppNavbar } from '../components/AppNavbar';
import { Spinner } from '../components/ui/Spinner';

interface TopicData {
  name: string;
  status: 'WEAK' | 'AVERAGE' | 'STRONG' | 'COMPLETED';
}

interface SubjectData {
  name: string;
  examDate: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
  topics: TopicData[];
}

export const CreatePlanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [generationStage, setGenerationStage] = useState<number>(0);

  // Form State
  const [name, setName] = useState<string>(user?.name || '');
  const [educationLevel, setEducationLevel] = useState<string>('Undergraduate');
  const [examType, setExamType] = useState<string>('Semester Finals');
  const [examStartDate, setExamStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [examEndDate, setExamEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  });

  // Subjects & Topics
  const [subjects, setSubjects] = useState<SubjectData[]>([
    {
      name: 'Data Structures & Algorithms',
      examDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      difficulty: 'HARD',
      confidence: 'WEAK',
      topics: [
        { name: 'Arrays & Two Pointers', status: 'AVERAGE' },
        { name: 'Linked Lists & Stacks', status: 'AVERAGE' },
        { name: 'Binary Trees & BST', status: 'WEAK' },
        { name: 'Dynamic Programming', status: 'WEAK' }
      ]
    },
    {
      name: 'Operating Systems',
      examDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 20);
        return d.toISOString().split('T')[0];
      })(),
      difficulty: 'MEDIUM',
      confidence: 'AVERAGE',
      topics: [
        { name: 'Process Scheduling & Threads', status: 'STRONG' },
        { name: 'Memory Management & Paging', status: 'AVERAGE' },
        { name: 'Concurrency & Deadlocks', status: 'WEAK' }
      ]
    }
  ]);

  // Topic input helper
  const [newTopicInputs, setNewTopicInputs] = useState<{ [key: number]: string }>({});

  // Availability
  const [dailyHoursWeekday, setDailyHoursWeekday] = useState<number>(3);
  const [dailyHoursWeekend, setDailyHoursWeekend] = useState<number>(5);
  const [preferredStudyStart, setPreferredStudyStart] = useState<string>('09:00');
  const [preferredStudyEnd, setPreferredStudyEnd] = useState<string>('21:00');
  const [sessionLength, setSessionLength] = useState<number>(60);
  const [breakDuration, setBreakDuration] = useState<number>(15);

  // AI Topic Suggester State
  const [loadingAiTopics, setLoadingAiTopics] = useState<{ [key: number]: boolean }>({});
  const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subject Handlers
  const addSubject = () => {
    const newExamDate = new Date();
    newExamDate.setDate(newExamDate.getDate() + 21);
    setSubjects([
      ...subjects,
      {
        name: '',
        examDate: newExamDate.toISOString().split('T')[0],
        difficulty: 'MEDIUM',
        confidence: 'AVERAGE',
        topics: [{ name: 'Introduction & Core Concepts', status: 'AVERAGE' }]
      }
    ]);
  };

  const removeSubject = (idx: number) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const updateSubject = (idx: number, field: keyof SubjectData, val: any) => {
    const updated = [...subjects];
    updated[idx] = { ...updated[idx], [field]: val };
    setSubjects(updated);
  };

  // AI Syllabus & Topic Breakdown Generation
  const handleSuggestTopics = async (sIdx: number) => {
    const subject = subjects[sIdx];
    if (!subject.name || subject.name.trim() === '') {
      setAiMessage({ type: 'error', text: 'Please enter a Subject Name first (e.g. Operating Systems, Calculus, DSA).' });
      setTimeout(() => setAiMessage(null), 4000);
      return;
    }

    setLoadingAiTopics(prev => ({ ...prev, [sIdx]: true }));
    setAiMessage(null);

    try {
      const res = await api.ai.suggestTopics({
        subjectName: subject.name.trim(),
        gradeLevel: educationLevel,
        examType: examType
      });

      if (res.success && res.data?.suggestedTopics?.length > 0) {
        const generatedTopics: TopicData[] = res.data.suggestedTopics.map(t => ({
          name: t.name,
          status: t.difficulty === 'HARD' ? 'WEAK' : t.difficulty === 'EASY' ? 'STRONG' : 'AVERAGE'
        }));

        setSubjects(prev => {
          const copy = [...prev];
          copy[sIdx] = {
            ...copy[sIdx],
            topics: generatedTopics
          };
          return copy;
        });

        setAiMessage({
          type: 'success',
          text: `✨ StudyPal generated ${generatedTopics.length} high-yield topics for "${subject.name}"!`
        });
        setTimeout(() => setAiMessage(null), 5000);
      }
    } catch (err: any) {
      setAiMessage({
        type: 'error',
        text: `Could not suggest topics: ${err.message || 'Please try again'}`
      });
      setTimeout(() => setAiMessage(null), 4000);
    } finally {
      setLoadingAiTopics(prev => ({ ...prev, [sIdx]: false }));
    }
  };

  const addTopic = (subjectIdx: number) => {
    const topicText = (newTopicInputs[subjectIdx] || '').trim();
    if (!topicText) return;

    const updated = [...subjects];
    updated[subjectIdx].topics.push({ name: topicText, status: 'AVERAGE' });
    setSubjects(updated);
    setNewTopicInputs({ ...newTopicInputs, [subjectIdx]: '' });
  };

  const removeTopic = (subjectIdx: number, topicIdx: number) => {
    const updated = [...subjects];
    if (updated[subjectIdx].topics.length <= 1) return;
    updated[subjectIdx].topics = updated[subjectIdx].topics.filter((_, i) => i !== topicIdx);
    setSubjects(updated);
  };

  const updateTopicStatus = (subjectIdx: number, topicIdx: number, status: 'WEAK' | 'AVERAGE' | 'STRONG') => {
    const updated = [...subjects];
    updated[subjectIdx].topics[topicIdx].status = status;
    setSubjects(updated);
  };

  // Submit Plan Generation
  const handleGeneratePlan = async () => {
    setStep(6);

    const stages = [
      'Understanding your syllabus and topics...',
      'Prioritizing high-weightage & weak areas...',
      'Balancing study blocks against your daily availability...',
      'Building your personalized adaptive study timetable...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setGenerationStage(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      await api.plans.createPlan({
        title: `${examType} Study Plan`,
        educationLevel,
        examType,
        examStartDate,
        examEndDate,
        dailyHoursWeekday: Number(dailyHoursWeekday),
        dailyHoursWeekend: Number(dailyHoursWeekend),
        preferredStudyStart,
        preferredStudyEnd,
        sessionLength: Number(sessionLength),
        breakDuration: Number(breakDuration),
        subjects: subjects.filter(s => s.name.trim().length > 0)
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('Plan creation error:', err);
      alert(err.message || 'Failed to generate study plan. Please verify dates and subject fields.');
      setStep(5);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F8FE', display: 'flex', flexDirection: 'column' }}>
      <AppNavbar />

      <div className="container" style={{ flex: 1, padding: '40px 24px', maxWidth: '840px' }}>
        {/* Step Indicator Header */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px 32px',
          boxShadow: '0 10px 30px -6px rgba(84, 72, 248, 0.05)',
          border: '1px solid rgba(228, 233, 250, 0.9)',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#5448F8" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#5448F8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Study Plan Wizard
              </span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
              Step {step} of 5
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(step / 5) * 100}%`,
              background: 'linear-gradient(90deg, #5345F8 0%, #6D5FF7 100%)',
              transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>
        </div>

        {/* Wizard Step Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: '36px',
          boxShadow: '0 20px 45px -12px rgba(84, 72, 248, 0.08)',
          border: '1px solid rgba(228, 233, 250, 0.9)',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* AI Status Banner */}
          {aiMessage && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: aiMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: aiMessage.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
              color: aiMessage.type === 'success' ? '#065F46' : '#991B1B',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Sparkles size={16} />
              <span>{aiMessage.text}</span>
            </div>
          )}

          {/* STEP 1: ABOUT YOU */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 1: Tell Us About Yourself
                </h2>
                <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px' }}>
                  Help StudyPal calibrate study blocks to your academic stage.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Education Level
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '15px',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="High School">High School / K-12</option>
                    <option value="Undergraduate">Undergraduate / College</option>
                    <option value="Postgraduate">Postgraduate / Master's</option>
                    <option value="Competitive Exams">Competitive Exam Aspirant (GATE/GRE/MCAT/JEE)</option>
                    <option value="Professional">Professional Certification</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Exam Category / Goal
                  </label>
                  <input
                    type="text"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    placeholder="e.g. Semester Finals, Board Exams, Midterms"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXAM TIMELINE */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 2: Target Exam Timeline
                </h2>
                <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px' }}>
                  Define your preparation window from today until your last exam date.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Preparation Start Date
                  </label>
                  <input
                    type="date"
                    value={examStartDate}
                    onChange={(e) => setExamStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Final Exam Date (Finish Line)
                  </label>
                  <input
                    type="date"
                    value={examEndDate}
                    onChange={(e) => setExamEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', background: '#F0EEFE', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(84, 72, 248, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5448F8', fontWeight: 700, fontSize: '14px' }}>
                  <Sparkles size={16} />
                  <span>AI Scheduling Note</span>
                </div>
                <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px', margin: 0 }}>
                  StudyPal will dynamically phase your calendar into Foundation, Problem Drill, Revision, and Timed Mocks across this window.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUBJECTS */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Step 3: Define Your Subjects
                  </h2>
                  <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
                    Set difficulty and your confidence level for each subject.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="btn-signin"
                  style={{ gap: '6px', fontSize: '13.5px' }}
                >
                  <Plus size={16} />
                  <span>Add Subject</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                {subjects.map((sub, idx) => (
                  <div key={idx} style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          Subject Name
                        </label>
                        <input
                          type="text"
                          required
                          value={sub.name}
                          onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                          placeholder="e.g. Mathematics"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13.5px',
                            outline: 'none',
                            background: '#FFFFFF'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          Exam Date
                        </label>
                        <input
                          type="date"
                          required
                          value={sub.examDate}
                          onChange={(e) => updateSubject(idx, 'examDate', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            outline: 'none',
                            background: '#FFFFFF'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          Difficulty
                        </label>
                        <select
                          value={sub.difficulty}
                          onChange={(e) => updateSubject(idx, 'difficulty', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            outline: 'none',
                            background: '#FFFFFF'
                          }}
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          Confidence
                        </label>
                        <select
                          value={sub.confidence}
                          onChange={(e) => updateSubject(idx, 'confidence', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13px',
                            outline: 'none',
                            background: '#FFFFFF'
                          }}
                        >
                          <option value="WEAK">Weak (Need focus)</option>
                          <option value="AVERAGE">Average</option>
                          <option value="STRONG">Strong</option>
                        </select>
                      </div>

                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(idx)}
                          style={{
                            marginTop: '18px',
                            background: '#FEE2E2',
                            border: 'none',
                            color: '#DC2626',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* AI Syllabus Generator Action */}
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleSuggestTopics(idx)}
                        disabled={loadingAiTopics[idx]}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          background: 'linear-gradient(135deg, #5448F8 0%, #7C3AED 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: loadingAiTopics[idx] ? 'not-allowed' : 'pointer',
                          opacity: loadingAiTopics[idx] ? 0.75 : 1,
                          boxShadow: '0 2px 8px rgba(84, 72, 248, 0.2)'
                        }}
                      >
                        {loadingAiTopics[idx] ? <Spinner size="xs" color="#FFFFFF" /> : <Sparkles size={13} />}
                        <span>{loadingAiTopics[idx] ? 'Generating Syllabus...' : '✨ Suggest Topics with AI'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TOPICS */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 4: Topics Under Each Subject
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
                  Break down each subject into key units or chapters for targeted spaced learning.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                {subjects.map((sub, sIdx) => (
                  <div key={sIdx} style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                        {sub.name || `Subject ${sIdx + 1}`}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleSuggestTopics(sIdx)}
                          disabled={loadingAiTopics[sIdx]}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #5448F8 0%, #7C3AED 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: loadingAiTopics[sIdx] ? 'not-allowed' : 'pointer',
                            opacity: loadingAiTopics[sIdx] ? 0.75 : 1
                          }}
                        >
                          {loadingAiTopics[sIdx] ? <Spinner size="xs" color="#FFFFFF" /> : <Sparkles size={12} />}
                          <span>{loadingAiTopics[sIdx] ? 'Synthesizing...' : 'Auto-Generate with AI'}</span>
                        </button>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          {sub.topics.length} topic{sub.topics.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Topic Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      {sub.topics.map((t, tIdx) => (
                        <div key={tIdx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: t.status === 'WEAK' ? '#FEF2F2' : t.status === 'STRONG' ? '#ECFDF5' : '#FFFFFF',
                          border: t.status === 'WEAK' ? '1px solid #FECACA' : t.status === 'STRONG' ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}>
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>{t.name}</span>
                          <select
                            value={t.status}
                            onChange={(e) => updateTopicStatus(sIdx, tIdx, e.target.value as any)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: t.status === 'WEAK' ? '#DC2626' : t.status === 'STRONG' ? '#059669' : '#5448F8',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="WEAK">Weak</option>
                            <option value="AVERAGE">Average</option>
                            <option value="STRONG">Strong</option>
                          </select>
                          {sub.topics.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTopic(sIdx, tIdx)}
                              style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Topic Input */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Add topic (e.g. Graph Algorithms, Thermodynamics)"
                        value={newTopicInputs[sIdx] || ''}
                        onChange={(e) => setNewTopicInputs({ ...newTopicInputs, [sIdx]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic(sIdx))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          outline: 'none',
                          background: '#FFFFFF'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addTopic(sIdx)}
                        style={{
                          background: '#5448F8',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: AVAILABILITY */}
          {step === 5 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 5: Your Study Availability
                </h2>
                <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px' }}>
                  Set daily study quotas, time windows, and rest intervals for burnout protection.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Weekday Study Hours / Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={dailyHoursWeekday}
                    onChange={(e) => setDailyHoursWeekday(parseFloat(e.target.value))}
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

                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Weekend Study Hours / Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    step="0.5"
                    value={dailyHoursWeekend}
                    onChange={(e) => setDailyHoursWeekend(parseFloat(e.target.value))}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Preferred Study Window Start
                  </label>
                  <input
                    type="time"
                    value={preferredStudyStart}
                    onChange={(e) => setPreferredStudyStart(e.target.value)}
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

                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Preferred Study Window End
                  </label>
                  <input
                    type="time"
                    value={preferredStudyEnd}
                    onChange={(e) => setPreferredStudyEnd(e.target.value)}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Session Length (Minutes)
                  </label>
                  <select
                    value={sessionLength}
                    onChange={(e) => setSessionLength(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14.5px',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value={45}>45 minutes (Pomodoro)</option>
                    <option value={60}>60 minutes (Standard)</option>
                    <option value={90}>90 minutes (Deep Focus)</option>
                    <option value={120}>120 minutes (Intensive)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Break Duration (Minutes)
                  </label>
                  <select
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14.5px',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: GENERATING STATE */}
          {step === 6 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#ECEBFE',
                color: '#5448F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 0 30px rgba(84, 72, 248, 0.3)'
              }}>
                <Spinner size="xl" color="#5448F8" />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A', marginBottom: '8px' }}>
                Creating Your Study Plan
              </h2>
              <p style={{ fontSize: '14.5px', color: '#64748B', marginBottom: '24px' }}>
                StudyPal AI is crafting your personalized, adaptive schedule
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '440px', textAlign: 'left', width: '100%' }}>
                {[
                  'Analyzing your subjects and topics...',
                  'Prioritizing upcoming exams and weak areas...',
                  'Balancing your available study hours...',
                  'Building your adaptive study sessions...'
                ].map((msg, idx) => {
                  const isDone = generationStage > idx;
                  const isCurrent = generationStage === idx;
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: isDone ? '#059669' : isCurrent ? '#5448F8' : '#94A3B8',
                      fontWeight: isCurrent ? 700 : 500,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isCurrent ? '#F5F3FF' : isDone ? '#F0FDF4' : 'transparent',
                      transition: 'all 0.3s ease'
                    }}>
                      {isDone ? (
                        <CheckCircle2 size={18} color="#059669" />
                      ) : isCurrent ? (
                        <Spinner size="xs" color="#5448F8" />
                      ) : (
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid #CBD5E1'
                        }} />
                      )}
                      <span>{msg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          {step < 6 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid #F1F5F9', marginTop: '24px' }}>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-signin"
                  style={{ gap: '6px' }}
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="btn-get-started"
                  style={{ gap: '8px' }}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  className="btn-get-started"
                  style={{ gap: '8px', padding: '12px 28px' }}
                >
                  <Sparkles size={18} />
                  <span>Generate My Study Plan</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
