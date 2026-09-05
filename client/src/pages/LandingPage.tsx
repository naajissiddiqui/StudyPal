import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Testimonials } from '../components/Testimonials';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { DemoModal } from '../components/Modals/DemoModal';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleSignIn = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleCreatePlan = () => {
    if (user) {
      navigate('/create-plan');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="app-root">
      {/* Background Ambient Orbs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="orb-3" />
        <div className="orb-4" />
      </div>

      <div className="container">
        {/* Navigation */}
        <Navbar 
          onOpenGetStarted={handleGetStarted}
          onOpenSignIn={handleSignIn}
        />

        {/* Hero Section */}
        <Hero 
          onOpenCreatePlan={handleCreatePlan}
          onOpenWatchDemo={() => setDemoModalOpen(true)}
        />

        {/* 3 Simple Steps */}
        <HowItWorks 
          onOpenCreatePlan={handleCreatePlan}
        />

        {/* Student Reviews & Testimonials */}
        <Testimonials />

        {/* FAQs */}
        <FAQ />

        {/* Footer */}
        <Footer />
      </div>

      {/* Demo Modal */}
      <DemoModal 
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onTryNow={handleCreatePlan}
      />
    </div>
  );
};
