'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

const steps = [
  {
    number: '01',
    icon: 'ClipboardDocumentListIcon',
    title: 'We Onboard Your School',
    body: 'Share your student data (names, classes, parent numbers, fee structure). We set up everything \u2014 no software to install, no training needed. Your staff doesn\u2019t lift a finger.',
    accent: '#0D9488',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    number: '02',
    icon: 'CogIcon',
    title: 'Automation Takes Over',
    body: 'Fee reminders go out automatically on schedule \u2014 gentle nudge \u2192 due date alert \u2192 formal escalation. Attendance alerts hit parents within minutes. Birthday wishes, festival greetings, daily reports \u2014 all on autopilot.',
    accent: '#1E3A5F',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    number: '03',
    icon: 'ChartBarIcon',
    title: 'You See Results',
    body: 'Watch your fee collection improve within the first month. Track everything from your dashboard \u2014 who paid, who didn\u2019t, which messages were read, which parents responded. Full visibility, zero manual work.',
    accent: '#F59E0B',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
];

export default function HowItWorksDetailed() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 reveal">
          <span className="section-label mb-3 block">Simple Setup</span>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] leading-tight">
            From Setup to Results{' '}
            <span className="text-gradient-teal">in 72 Hours</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className={`reveal ${i > 0 ? `delay-${i * 200}` : ''}`}>
              <div className={`h-full rounded-2xl border ${step.border} ${step.bg} p-8 relative`}>
                {/* Step number */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-800 mb-6"
                  style={{ backgroundColor: step.accent }}
                >
                  {step.number}
                </div>

                {/* Connector line (desktop only) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[52px] -right-4 w-8 border-t-2 border-dashed border-[#CBD5E1]" />
                )}

                <div className="flex items-center gap-3 mb-4">
                  <Icon name={step.icon} size={22} variant="outline" className="text-[#1E3A5F]" />
                  <h3 className="font-display text-xl font-700 text-[#1E3A5F]">{step.title}</h3>
                </div>
                <p className="text-[#475569] text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
