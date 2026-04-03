import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingHero from './components/PricingHero';
import PricingCards from './components/PricingCards';
import GuaranteeSection from './components/GuaranteeSection';
import PricingFAQ from './components/PricingFAQ';
import PricingCTA from './components/PricingCTA';
import ScrollRevealInit from '../homepage/components/ScrollRevealInit';
import ContactForm from '@/components/ContactForm';

export default function PricingPage() {
  return (
    <>
      <Header />
      <main>
        <PricingHero />
        <PricingCards />
        <GuaranteeSection />
        <PricingFAQ />
        <ContactForm />
        <PricingCTA />
      </main>
      <Footer />
      <ScrollRevealInit />
    </>
  );
}