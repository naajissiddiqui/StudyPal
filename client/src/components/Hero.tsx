import {
  Sparkles,
  ArrowRight,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import heroIllustration from '../assets/hero_3d_feathered.png';

interface HeroProps {
  onOpenCreatePlan: () => void;
  onOpenWatchDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCreatePlan, onOpenWatchDemo }) => {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-grid">
        {/* Left Hero Content */}
        <motion.div
          className="hero-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            className="pill-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Sparkles size={14} className="badge-sparkle" />
            <span>Your Personal AI Study Planner</span>
          </motion.div>

          {/* Heading */}
          <h1 className="hero-title">
            Study Smarter,<br />
            <span className="hero-title-highlight">Not Harder</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Get a personalized study plan that fits your exams, schedule and goals - powered by AI. Build better habits, stay consistent, and achieve more.
          </p>

          {/* CTA Row */}
          <div className="cta-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary-cta"
              onClick={onOpenCreatePlan}
              id="hero-create-plan-btn"
            >
              <span>Create Your Study Plan</span>
              <ArrowRight size={18} className="arrow-icon" />
            </motion.button>

            <button
              className="btn-watch-demo"
              onClick={onOpenWatchDemo}
              id="hero-watch-demo-btn"
            >
              <div className="play-circle">
                <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>
        </motion.div>

        {/* Right Hero Visual & 3D Scene */}
        <motion.div
          className="hero-right"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <div className="hero-scene-container">
            {/* The 3D Illustration artwork */}
            <motion.img
              src={heroIllustration}
              alt="StudyPal AI Robot studying on books"
              className="hero-main-illustration"
              animate={{
                y: [0, -6, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
