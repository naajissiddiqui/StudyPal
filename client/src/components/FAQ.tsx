import React, { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How is StudyPal different from regular calendar or timetable apps?',
      a: 'Traditional calendars expect you to follow a rigid schedule that breaks the moment you miss a day. StudyPal uses AI to continuously rebalance your timetable based on your actual pace, upcoming exam weightage, and spaced-repetition memory curves.'
    },
    {
      q: 'Can StudyPal handle multiple subjects and exams simultaneously?',
      a: 'Yes! You can add multiple subjects with varying exam dates and difficulty levels. StudyPal dynamically prioritizes high-weightage topics and coordinates parallel revision cycles.'
    },
    {
      q: 'What happens if I fall behind schedule?',
      a: 'Zero panic. StudyPal features one-click intelligent redistribution: it recalculates remaining study blocks without overcrowding your calendar or cutting into sleep.'
    },
    {
      q: 'Is StudyPal suitable for university, school, and competitive exams?',
      a: 'Absolutely. Whether preparing for university semester finals, SAT/ACT, NEET/JEE, USMLE, or professional certifications, StudyPal tailors study blocks to your specific exam format.'
    }
  ];

  return (
    <section className="faq-section" id="faqs">
      <div className="section-header">
        <div className="section-pill">
          <Sparkles size={14} />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="section-title">Everything You Need to Know</h2>
        <p className="section-subtitle">
          Got questions? We have got clear answers to help you start studying smarter.
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div 
              key={idx} 
              className={`faq-item ${isOpen ? 'active' : ''}`}
            >
              <button 
                className="faq-question"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <span>{faq.q}</span>
                <ChevronDown className="faq-icon" size={20} />
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="faq-answer">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
