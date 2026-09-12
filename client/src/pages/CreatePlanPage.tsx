import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  UploadCloud,
  X,
  Layers,
  Eye,
  RotateCcw,
  BookOpen,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AppNavbar } from '../components/AppNavbar';
import { Spinner } from '../components/ui/Spinner';

interface TopicData {
  name: string;
  status: 'WEAK' | 'AVERAGE' | 'STRONG' | 'COMPLETED';
  unitName?: string;
  subtopics?: string[];
  keyConcepts?: string[];
}

interface SyllabusTopicItem {
  name: string;
  subtopics?: string[];
  keyConcepts?: string[];
}

interface SyllabusUnitData {
  name: string;
  topics: SyllabusTopicItem[];
}

interface SyllabusSubjectData {
  name: string;
  overview?: string;
  units: SyllabusUnitData[];
  flattenedTopics: Array<{
    name: string;
    unitName: string;
    subtopics: string[];
    keyConcepts: string[];
    status: 'WEAK' | 'AVERAGE' | 'STRONG';
  }>;
}

interface PlanSyllabusData {
  fileName: string;
  institution?: string;
  program?: string;
  pageCount: number;
  rawTextLength: number;
  subjects: SyllabusSubjectData[];
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

  // Plan-Level Syllabus State
  const [planSyllabus, setPlanSyllabus] = useState<PlanSyllabusData | null>(null);
  const [uploadingSyllabus, setUploadingSyllabus] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [syllabusPreviewOpen, setSyllabusPreviewOpen] = useState<boolean>(false);

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
        { name: 'Arrays & Two Pointers', status: 'AVERAGE', unitName: 'Unit 1: Linear Structures' },
        { name: 'Linked Lists & Stacks', status: 'AVERAGE', unitName: 'Unit 1: Linear Structures' },
        { name: 'Binary Trees & BST', status: 'WEAK', unitName: 'Unit 2: Non-Linear Structures' },
        { name: 'Dynamic Programming', status: 'WEAK', unitName: 'Unit 3: Advanced Problem Solving' }
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
        { name: 'Process Scheduling & Threads', status: 'STRONG', unitName: 'Unit 1: Process Management' },
        { name: 'Memory Management & Paging', status: 'AVERAGE', unitName: 'Unit 2: Memory Hierarchy' },
        { name: 'Concurrency & Deadlocks', status: 'WEAK', unitName: 'Unit 3: Synchronization' }
      ]
    }
  ]);

  // Topic input helper for Step 4
  const [newTopicInputs, setNewTopicInputs] = useState<{ [key: number]: string }>({});

  // Availability
  const [dailyHoursWeekday, setDailyHoursWeekday] = useState<number>(3);
  const [dailyHoursWeekend, setDailyHoursWeekend] = useState<number>(5);
  const [preferredStudyStart, setPreferredStudyStart] = useState<string>('09:00');
  const [preferredStudyEnd, setPreferredStudyEnd] = useState<string>('21:00');
  const [sessionLength, setSessionLength] = useState<number>(60);
  const [breakDuration, setBreakDuration] = useState<number>(15);

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

  // Plan-Level Single Syllabus PDF Upload Handler
  const handleUploadPlanSyllabus = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setAiMessage({ type: 'error', text: 'Please select a valid PDF file (.pdf).' });
      setTimeout(() => setAiMessage(null), 5000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAiMessage({ type: 'error', text: 'PDF file size exceeds 10MB limit. Please upload a smaller syllabus.' });
      setTimeout(() => setAiMessage(null), 5000);
      return;
    }

    setUploadingSyllabus(true);
    setAiMessage(null);

    try {
      const res = await api.syllabus.upload(file);

      if (res.success && res.data) {
        const { fileName, institution, program, pageCount, rawTextLength, subjects: extractedSubjects } = res.data;

        // Store plan syllabus structure
        setPlanSyllabus({
          fileName,
          institution,
          program,
          pageCount,
          rawTextLength,
          subjects: extractedSubjects
        });

        // Automatically populate subject cards
        const baseStartDate = new Date(examStartDate || new Date());
        const populatedSubjects: SubjectData[] = extractedSubjects.map((s, idx) => {
          const defaultExamDate = new Date(baseStartDate);
          defaultExamDate.setDate(defaultExamDate.getDate() + 14 + (idx * 4));

          return {
            name: s.name,
            examDate: defaultExamDate.toISOString().split('T')[0],
            difficulty: 'MEDIUM',
            confidence: 'AVERAGE',
            topics: s.flattenedTopics.map(t => ({
              name: t.name,
              unitName: t.unitName,
              subtopics: t.subtopics,
              keyConcepts: t.keyConcepts,
              status: t.status || 'AVERAGE'
            }))
          };
        });

        setSubjects(populatedSubjects);

        const totalTopics = extractedSubjects.reduce((acc, s) => acc + s.flattenedTopics.length, 0);
        setAiMessage({
          type: 'success',
          text: `✓ Syllabus Processed: Gemini extracted ${extractedSubjects.length} subjects & ${totalTopics} topics from "${fileName}"!`
        });
        setTimeout(() => setAiMessage(null), 7000);
      }
    } catch (err: any) {
      console.error('Syllabus upload error:', err);
      setAiMessage({
        type: 'error',
        text: `Syllabus parsing failed: ${err.message || 'Please verify the PDF contains readable text and try again.'}`
      });
      setTimeout(() => setAiMessage(null), 7000);
    } finally {
      setUploadingSyllabus(false);
    }
  };

  const handleRemovePlanSyllabus = () => {
    setPlanSyllabus(null);
    setAiMessage({
      type: 'success',
      text: 'Uploaded syllabus removed. You can upload a new syllabus or continue with manual subject configuration.'
    });
    setTimeout(() => setAiMessage(null), 4000);
  };

  const addTopic = (subjectIdx: number) => {
    const topicText = (newTopicInputs[subjectIdx] || '').trim();
    if (!topicText) return;

    const updated = [...subjects];
    updated[subjectIdx].topics.push({ name: topicText, status: 'AVERAGE', unitName: 'Custom Topics' });
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
    if (subjects.length === 0 || subjects.every(s => s.name.trim().length === 0)) {
      alert('Please define at least one subject before generating your study plan.');
      return;
    }

    setStep(6);

    const stages = [
      'Grounding curriculum in your official syllabus topics...',
      'Calculating deterministic priority scores (Urgency × Difficulty × Weakness)...',
      'Balancing daily study blocks and cognitive rest intervals...',
      'Synthesizing your personalized, collision-free study timetable...'
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
        syllabus: planSyllabus ? {
          fileName: planSyllabus.fileName,
          rawTextLength: planSyllabus.rawTextLength,
          subjects: planSyllabus.subjects.map(s => ({
            name: s.name,
            overview: s.overview,
            units: s.units
          }))
        } : undefined,
        subjects: subjects.filter(s => s.name.trim().length > 0).map(s => ({
          name: s.name,
          examDate: s.examDate,
          difficulty: s.difficulty,
          confidence: s.confidence,
          topics: s.topics.length > 0 ? s.topics : [{ name: 'Core Foundations', status: 'AVERAGE' }]
        }))
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

      <div className="container" style={{ flex: 1, padding: '40px 24px', maxWidth: '860px' }}>
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
          minHeight: '460px',
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

          {/* STEP 2: TIMELINE */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 2: Exam Timeline & Window
                </h2>
                <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px' }}>
                  Define your study prep start date and final examination deadline.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Study Plan Start Date
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
                    Final Exam End Date
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

          {/* STEP 3: DEFINE YOUR SUBJECTS & SYLLABUS */}
          {step === 3 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 3: Define Your Subjects & Syllabus
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
                  Upload your official syllabus PDF once to auto-extract all subjects, units, and topics for your study plan.
                </p>
              </div>

              {/* TOP OF STEP 3: OFFICIAL SYLLABUS UPLOAD BOX */}
              {!planSyllabus ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleUploadPlanSyllabus(e.dataTransfer.files[0]);
                    }
                  }}
                  style={{
                    background: isDragOver ? '#EEF2FF' : '#F8FAFF',
                    border: isDragOver ? '2px dashed #5448F8' : '2px dashed #C7D2FE',
                    borderRadius: '20px',
                    padding: '30px 24px',
                    textAlign: 'center',
                    marginBottom: '26px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(84, 72, 248, 0.04)'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                    color: '#5448F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px auto',
                    boxShadow: '0 4px 12px rgba(84, 72, 248, 0.12)'
                  }}>
                    {uploadingSyllabus ? <Spinner size="md" color="#5448F8" /> : <UploadCloud size={28} />}
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E1B4B', margin: '0 0 6px 0' }}>
                    {uploadingSyllabus ? 'Extracting Curriculum...' : 'Upload Your Official Syllabus'}
                  </h3>

                  <p style={{ fontSize: '13.5px', color: '#64748B', maxWidth: '520px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                    {uploadingSyllabus
                      ? 'Reading PDF document, identifying all subjects, units, and high-yield topics...'
                      : 'Upload your university/exam board syllabus PDF. This single document will be used as the authoritative source of truth for your entire study plan.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: uploadingSyllabus ? '#94A3B8' : 'linear-gradient(135deg, #5448F8 0%, #6D5FF7 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: uploadingSyllabus ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(84, 72, 248, 0.3)',
                      transition: 'transform 0.15s ease'
                    }}>
                      {uploadingSyllabus ? <Spinner size="xs" color="#FFFFFF" /> : <UploadCloud size={16} />}
                      <span>{uploadingSyllabus ? 'Analyzing Syllabus...' : 'Upload Syllabus PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={uploadingSyllabus}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadPlanSyllabus(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '12px' }}>
                    Supports PDF up to 10MB • All subjects extracted automatically
                  </div>
                </div>
              ) : (
                /* PROCESSED SYLLABUS BANNER */
                <div style={{
                  background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '20px',
                  padding: '20px 24px',
                  marginBottom: '26px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#DCFCE7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16A34A',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)'
                      }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#166534' }}>
                            ✓ Syllabus Processed
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#15803D',
                            background: '#BBF7D0',
                            padding: '2px 8px',
                            borderRadius: '999px'
                          }}>
                            Source of Truth
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#15803D', margin: '2px 0 0 0' }}>
                          Extracted from <strong>{planSyllabus.fileName}</strong> ({planSyllabus.pageCount} pages)
                          {planSyllabus.institution ? ` • ${planSyllabus.institution}` : ''}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSyllabusPreviewOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#FFFFFF',
                          color: '#166534',
                          border: '1px solid #86EFAC',
                          padding: '7px 14px',
                          borderRadius: '10px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                        }}
                      >
                        <Eye size={14} />
                        <span>Review Extracted Curriculum</span>
                      </button>

                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FFFFFF',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        padding: '7px 14px',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        <RotateCcw size={13} />
                        <span>Replace PDF</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadPlanSyllabus(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemovePlanSyllabus}
                        title="Remove uploaded syllabus"
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          padding: '7px 10px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Subjects Pill Bar */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(134, 239, 172, 0.4)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                      We found {planSyllabus.subjects.length} subjects in your curriculum:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {planSyllabus.subjects.map((sub, sIdx) => (
                        <div key={sIdx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#FFFFFF',
                          border: '1px solid #86EFAC',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#166534'
                        }}>
                          <BookOpen size={12} color="#16A34A" />
                          <span>{sub.name}</span>
                          <span style={{ fontSize: '10.5px', color: '#15803D', background: '#DCFCE7', padding: '1px 5px', borderRadius: '4px' }}>
                            {sub.units.length} Units • {sub.flattenedTopics.length} Topics
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBJECT CONFIGURATION CARDS SECTION */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {planSyllabus ? 'Configure Extracted Subjects' : 'Your Subject List'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                    Set your exam dates, difficulty levels, and current confidence for each subject.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="btn-signin"
                  style={{ gap: '6px', fontSize: '13px', padding: '6px 14px' }}
                >
                  <Plus size={15} />
                  <span>Add Subject Manually</span>
                </button>
              </div>

              {/* Subject Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {subjects.map((sub, idx) => (
                  <div key={idx} style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    {/* Header Row: Subject Name + Topic Tag Badge + Remove Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="text"
                          required
                          value={sub.name}
                          onChange={(e) => updateSubject(idx, 'name', e.target.value)}
                          placeholder="Subject Name (e.g. Data Structures & Algorithms)"
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            fontSize: '14.5px',
                            fontWeight: 700,
                            color: '#0F172A',
                            outline: 'none',
                            background: '#FFFFFF'
                          }}
                        />
                        {sub.topics.length > 0 && (
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#5448F8',
                            background: '#EEF2FF',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Layers size={12} />
                            {sub.topics.length} Syllabus Topics
                          </span>
                        )}
                      </div>

                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubject(idx)}
                          title="Remove this subject"
                          style={{
                            background: '#FEE2E2',
                            border: 'none',
                            color: '#DC2626',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    {/* Form Controls Grid: Exam Date, Difficulty, Confidence */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          <Calendar size={12} />
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
                          Difficulty Level
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
                          <option value="EASY">Easy (0.9x)</option>
                          <option value="MEDIUM">Medium (1.2x)</option>
                          <option value="HARD">Hard (1.6x)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          Current Confidence
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
                          <option value="WEAK">Weak (1.8x priority)</option>
                          <option value="AVERAGE">Average (1.2x)</option>
                          <option value="STRONG">Strong (0.8x)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TOPICS & CONFIDENCE REVIEW */}
          {step === 4 && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Step 4: Review Curriculum Topics
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', marginTop: '2px' }}>
                  Review units extracted from your syllabus and customize topic-level confidence before timetable generation.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {subjects.map((sub, sIdx) => {
                  // Group topics by unitName
                  const unitGroups: { [unitName: string]: TopicData[] } = {};
                  for (const t of sub.topics) {
                    const uName = t.unitName || 'Core Curriculum Topics';
                    if (!unitGroups[uName]) unitGroups[uName] = [];
                    unitGroups[uName].push(t);
                  }

                  return (
                    <div key={sIdx} style={{
                      background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '20px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                            {sub.name || `Subject ${sIdx + 1}`}
                          </span>
                          {planSyllabus && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#065F46',
                              background: '#D1FAE5',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={12} />
                              Syllabus Grounded
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          {sub.topics.length} topic{sub.topics.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Topic Tags Grouped by Unit */}
                      {Object.entries(unitGroups).map(([unitName, unitTopics], uIdx) => (
                        <div key={uIdx} style={{ marginBottom: '16px' }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#5448F8',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <Layers size={13} />
                            <span>{unitName}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {unitTopics.map((t) => {
                              const tIdx = sub.topics.findIndex(item => item === t);
                              return (
                                <div key={tIdx} style={{
                                  background: t.status === 'WEAK' ? '#FEF2F2' : t.status === 'STRONG' ? '#ECFDF5' : '#FFFFFF',
                                  border: t.status === 'WEAK' ? '1px solid #FECACA' : t.status === 'STRONG' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  fontSize: '13px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{t.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <select
                                        value={t.status}
                                        onChange={(e) => updateTopicStatus(sIdx, tIdx, e.target.value as any)}
                                        style={{
                                          border: '1px solid #CBD5E1',
                                          background: '#FFFFFF',
                                          borderRadius: '6px',
                                          padding: '2px 8px',
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
                                          title="Remove topic"
                                          style={{ border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* ACTUAL NAMED SUBTOPICS */}
                                  {t.subtopics && t.subtopics.length > 0 && (
                                    <div style={{ marginTop: '8px', paddingLeft: '10px', borderLeft: '2px solid #E0E7FF' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                                        Subtopics:
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {t.subtopics.map((st, stIdx) => (
                                          <div key={stIdx} style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                            <span style={{ color: '#5448F8', fontSize: '10px' }}>•</span>
                                            <span>{st}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* KEY CONCEPTS */}
                                  {t.keyConcepts && t.keyConcepts.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px', paddingLeft: '10px' }}>
                                      {t.keyConcepts.map((kc, i) => (
                                        <span key={i} style={{ fontSize: '10.5px', background: '#EEF2FF', color: '#4F46E5', padding: '1px 6px', borderRadius: '4px' }}>
                                          ⚡ {kc}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Add Topic Input */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
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
                  );
                })}
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
                  'Grounding curriculum in your official syllabus topics...',
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

          {/* Full Syllabus Review Modal */}
          {syllabusPreviewOpen && planSyllabus && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                maxWidth: '750px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                {/* Modal Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#F8FAFC'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#DCFCE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16A34A'
                    }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        Official Extracted Curriculum
                      </h3>
                      <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0 0' }}>
                        Source: {planSyllabus.fileName} ({planSyllabus.subjects.length} Subjects Extracted)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSyllabusPreviewOpen(false)}
                    style={{
                      border: 'none',
                      background: '#F1F5F9',
                      color: '#64748B',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {planSyllabus.subjects.map((sub, sIdx) => (
                    <div key={sIdx} style={{
                      background: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BookOpen size={16} color="#5448F8" />
                          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            {sub.name}
                          </h4>
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#5448F8', background: '#EEF2FF', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          {sub.units.length} Units • {sub.flattenedTopics.length} Topics
                        </span>
                      </div>

                      {sub.overview && (
                        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                          {sub.overview}
                        </p>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {sub.units.map((unit, uIdx) => (
                          <div key={uIdx} style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '12px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <Layers size={14} color="#5448F8" />
                              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B' }}>
                                {unit.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {unit.topics.map((t, tIdx) => (
                                <div key={tIdx} style={{
                                  background: '#F8FAFC',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #F1F5F9',
                                  fontSize: '12.5px'
                                }}>
                                  <div style={{ fontWeight: 600, color: '#1E293B' }}>• {t.name}</div>
                                  {((t.subtopics && t.subtopics.length > 0) || (t.keyConcepts && t.keyConcepts.length > 0)) && (
                                    <div style={{ marginTop: '6px', paddingLeft: '10px', borderLeft: '2px solid #E2E8F0' }}>
                                      {t.subtopics && t.subtopics.length > 0 && (
                                        <div style={{ marginBottom: t.keyConcepts && t.keyConcepts.length > 0 ? '6px' : 0 }}>
                                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '3px' }}>Subtopics:</div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {t.subtopics.map((st, i) => (
                                              <div key={i} style={{ fontSize: '11.5px', color: '#475569', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                <span style={{ color: '#5448F8', fontSize: '9px' }}>•</span>
                                                <span>{st}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {t.keyConcepts && t.keyConcepts.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                          {t.keyConcepts.map((kc, i) => (
                                            <span key={i} style={{ fontSize: '10.5px', background: '#EEF2FF', color: '#4F46E5', padding: '1px 6px', borderRadius: '4px' }}>
                                              ⚡ {kc}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setSyllabusPreviewOpen(false)}
                    className="btn-signin"
                    style={{ fontSize: '13px', padding: '8px 18px' }}
                  >
                    Close Preview
                  </button>
                </div>
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
