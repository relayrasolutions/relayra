import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const steps = [
  {
    number: '1',
    title: 'We set up your school data',
    description: 'Share your student list in any format — Excel, CSV, or even a photo of your register. Our team imports everything: student names, parent contacts, fee structures, class information. You don\'t touch any software.',
    color: '#1E3A5F',
    bg: 'bg-[#1E3A5F]/5',
  },
  {
    number: '2',
    title: 'Parents get automated WhatsApp messages',
    description: 'Fee reminders, attendance alerts, school notices, and exam schedules — all delivered directly to parents\' WhatsApp. Our 3-level escalation system handles overdue fees automatically with the right tone at the right time.',
    color: '#0D9488',
    bg: 'bg-[#0D9488]/5',
  },
  {
    number: '3',
    title: 'You track everything from your dashboard',
    description: 'Real-time analytics on fee collection, attendance trends, message delivery, and parent engagement. Get a daily summary report at 4 PM. Know exactly which fees are collected, pending, or overdue — without opening a single Excel sheet.',
    color: '#F59E0B',
    bg: 'bg-[#F59E0B]/5',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] mb-4">
              How Relayra Works
            </h1>
            <p className="text-[#64748B] text-lg max-w-xl mx-auto">
              Three simple steps. No technical setup. We do the work, you see the results.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.number} className={`${step.bg} rounded-2xl border border-[#E2E8F0] p-8`}>
                <div className="flex items-start gap-5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-display font-800 text-lg flex-shrink-0"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-700 text-[#1E293B] mb-3">
                      {step.title}
                    </h2>
                    <p className="text-[#64748B] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F59E0B] text-white rounded-lg font-semibold text-base hover:bg-[#D97706] transition-colors"
            >
              Book a Free Demo
            </a>
            <p className="text-[#94A3B8] text-sm mt-3">
              No commitment. 20-minute live walkthrough.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-[#0D9488] font-semibold text-sm hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
