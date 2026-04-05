'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './homepage/components/HeroSection';
import StatsBar from './homepage/components/StatsBar';
import FeatureBento from './homepage/components/FeatureBento';
import HowItWorks from './homepage/components/HowItWorks';
import TestimonialsSection from './homepage/components/TestimonialsSection';
import PricingTeaser from './homepage/components/PricingTeaser';
import ScrollRevealInit from './homepage/components/ScrollRevealInit';
import ContactForm from '@/components/ContactForm';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
      if (user.role === 'super_admin') router.push('/admin');
      else if (user.role === 'school_staff') router.push('/teacher');
      else router.push('/dashboard');
    }
  }, [user, loading, router]);

  // If logged in, show loading while redirecting
  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-[#1E3A5F] rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <p className="text-[#64748B] text-sm">Loading Relayra...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show marketing landing page
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <StatsBar />
        <FeatureBento />
        <HowItWorks />
        <TestimonialsSection />
        <PricingTeaser />
        <ContactForm />
      </main>
      <Footer />
      <ScrollRevealInit />
    </>
  );
}
