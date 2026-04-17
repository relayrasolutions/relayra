'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './homepage/components/HeroSection';
import PainPoints from './homepage/components/PainPoints';
import WhyWhatsApp from './homepage/components/WhyWhatsApp';
import HowItWorksDetailed from './homepage/components/HowItWorksDetailed';
import RelayraVsOthers from './homepage/components/RelayraVsOthers';
import StatsBar from './homepage/components/StatsBar';
import FeatureBento from './homepage/components/FeatureBento';
import HowItWorks from './homepage/components/HowItWorks';
import EscalationSection from './homepage/components/EscalationSection';
import BuiltForIndia from './homepage/components/BuiltForIndia';
import PricingTeaser from './homepage/components/PricingTeaser';
import ScrollRevealInit from './homepage/components/ScrollRevealInit';
import ContactForm from '@/components/ContactForm';

// The landing page is PUBLIC — it always renders the marketing site regardless
// of auth state. Logged-in users see a "Dashboard" button in the navbar
// (rendered by Header based on useAuth) but are NEVER auto-redirected from /.
export default function RootPage() {
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
