import { Sparkles, Calendar, Cpu, Trophy, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HowItWorksProps {
  onOpenCreatePlan?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = () => {
  const steps = [
    {
      number: '01',
      title: 'Input Your Syllabus & Goals',
      description: 'Enter your upcoming exams, subjects, target scores, and daily available study hours. StudyPal identifies high-weightage topics.',
      icon: Calendar,
      highlight: 'Takes less than 2 minutes'
    },
    {
      number: '02',
      title: 'AI Generates Your Timetable',
      description: 'Our AI engine distributes topics across spaced repetition intervals, active recall sessions, and mock test checkpoints.',
      icon: Cpu,
      highlight: '100% personalized to your rhythm'
    },
    {
      number: '03',
      title: 'Track, Adapt & Ace Your Exams',
      description: 'Check off daily sessions. If life gets busy, StudyPal automatically reschedules missed tasks without breaking your momentum.',
      icon: Trophy,
      highlight: 'Zero stress, maximum retention'
    }
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="section-header">
        <div className="section-pill">
          <Sparkles size={14} />
          <span>How It Works</span>
        </div>
        <h2 className="section-title">Your Study Plan in 3 Simple Steps</h2>
        <p className="section-subtitle">
          From your goals to a personalized timetable — in just a few minutes.
        </p>
      </div>

      <div className="steps-grid">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div 
              key={idx}
              className="step-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                <div className="step-number-badge">{step.number}</div>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F0EEFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5448F8' }}>
                  <Icon size={20} />
                </div>
              </div>
              <h3 className="step-card-title">{step.title}</h3>
              <p className="step-card-desc">{step.description}</p>
              <div className="step-card-footer">
                <CheckCircle2 size={16} />
                <span>{step.highlight}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
