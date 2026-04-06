import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 sm:p-12">
            <h1 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] mb-6">
              About Relayra Solutions
            </h1>

            <div className="space-y-6 text-[#475569] text-base leading-relaxed">
              <p>
                <strong className="text-[#1E293B]">Relayra Solutions</strong> is a managed operations automation platform built specifically for Indian private schools.
              </p>

              <p>
                Founded in <strong className="text-[#1E293B]">Moradabad, Uttar Pradesh</strong>, we understand the daily operational challenges that school administrators face — from chasing fee payments to managing parent communication across hundreds of families.
              </p>

              <div className="bg-[#F0FDFA] border border-[#0D9488]/20 rounded-xl p-6">
                <h2 className="font-display text-lg font-700 text-[#0D9488] mb-3">Our Mission</h2>
                <p className="text-[#475569]">
                  Eliminate manual admin chaos from schools using WhatsApp-first automation. We believe school staff should spend their time on education, not chasing payments or making phone calls.
                </p>
              </div>

              <h2 className="font-display text-xl font-700 text-[#1E3A5F] pt-2">What We Do</h2>
              <ul className="space-y-3">
                {[
                  'Automated fee reminders and payment collection via WhatsApp',
                  'Smart 3-level escalation system for overdue fees',
                  'Daily attendance tracking and parent notifications',
                  'AI-powered school communication (notices, events, emergencies)',
                  'Real-time analytics dashboard for school administrators',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-[#0D9488]" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="font-display text-xl font-700 text-[#1E3A5F] pt-2">Contact Us</h2>
              <p>
                Email: <a href="mailto:hello@relayrasolutions.com" className="text-[#0D9488] hover:underline">hello@relayrasolutions.com</a>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[#0D9488] font-semibold text-sm hover:underline"
              >
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
