import React from 'react';
import { Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const Testimonials: React.FC = () => {
  const reviews = [
    {
      name: 'Priya Sharma',
      role: 'Engineering Student, IIT Delhi',
      rating: 5,
      avatar: 'PS',
      text: 'StudyPal completely transformed how I prepared for semester finals. Instead of panicking over 6 subjects, I had exact daily 90-min tasks. Scored a 9.4 GPA!'
    },
    {
      name: 'Alex Chen',
      role: 'Pre-Med Student, Stanford',
      rating: 5,
      avatar: 'AC',
      text: 'The spaced repetition schedule saved me on Organic Chemistry. The AI adapted every time I had a lab shift or missed a day. Absolute game changer.'
    },
    {
      name: 'Rohan Mehta',
      role: 'Competitive Exam Aspirant (GATE)',
      rating: 5,
      avatar: 'RM',
      text: 'Most timetable apps are rigid spreadsheets that fail after day two. StudyPal is like having an empathetic personal tutor who keeps you on track.'
    }
  ];

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="section-header">
        <div className="section-pill">
          <Sparkles size={14} />
          <span>Student Stories</span>
        </div>
        <h2 className="section-title">Loved by 10,000+ Ambitious Students</h2>
        <p className="section-subtitle">
          Real results from students who replaced all-nighters with structured AI planning.
        </p>
      </div>

      <div className="testimonials-grid">
        {reviews.map((rev, idx) => (
          <motion.div 
            key={idx}
            className="testimonial-card"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: idx * 0.1 }}
          >
            <div>
              <div className="testimonial-stars">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} size={18} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
              <p className="testimonial-text">"{rev.text}"</p>
            </div>

            <div className="testimonial-author">
              <div className="author-avatar">{rev.avatar}</div>
              <div>
                <h4 className="author-name">{rev.name}</h4>
                <p className="author-role">{rev.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
