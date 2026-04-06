import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import StatsBar from './components/StatsBar';
import FeatureBento from './components/FeatureBento';
import HowItWorks from './components/HowItWorks';
import EscalationSection from './components/EscalationSection';
import PricingTeaser from './components/PricingTeaser';
import ScrollRevealInit from './components/ScrollRevealInit';
import ContactForm from '@/components/ContactForm';

export default function Homepage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <StatsBar />
        <FeatureBento />
        <HowItWorks />
        <EscalationSection />
        <PricingTeaser />
        <ContactForm />
      </main>
      <Footer />
      <ScrollRevealInit />
    </>
  );
}