import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeaturesHero from './components/FeaturesHero';
import RevenueEngineSection from './components/RevenueEngineSection';
import CommunicationSection from './components/CommunicationSection';
import OperationsSection from './components/OperationsSection';
import FeaturesCTA from './components/FeaturesCTA';
import ScrollRevealInit from '../homepage/components/ScrollRevealInit';

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main>
        <FeaturesHero />
        <RevenueEngineSection />
        <CommunicationSection />
        <OperationsSection />
        <FeaturesCTA />
      </main>
      <Footer />
      <ScrollRevealInit />
    </>
  );
}