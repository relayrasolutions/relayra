import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import PainPoints from './components/PainPoints';
import WhyWhatsApp from './components/WhyWhatsApp';
import HowItWorksDetailed from './components/HowItWorksDetailed';
import RelayraVsOthers from './components/RelayraVsOthers';
import StatsBar from './components/StatsBar';
import FeatureBento from './components/FeatureBento';
import HowItWorks from './components/HowItWorks';
import EscalationSection from './components/EscalationSection';
import BuiltForIndia from './components/BuiltForIndia';
import PricingTeaser from './components/PricingTeaser';
import ScrollRevealInit from './components/ScrollRevealInit';
import ContactForm from '@/components/ContactForm';

export default function Homepage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <PainPoints />
        <WhyWhatsApp />
        <HowItWorksDetailed />
        <RelayraVsOthers />
        <StatsBar />
        <FeatureBento />
        <HowItWorks />
        <EscalationSection />
        <BuiltForIndia />
        <PricingTeaser />
        <ContactForm />
      </main>
      <Footer />
      <ScrollRevealInit />
    </>
  );
}