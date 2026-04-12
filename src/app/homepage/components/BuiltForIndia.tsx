'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

const features = [
  {
    icon: 'ListBulletIcon',
    title: 'Menu-Based Parent Communication',
    body: 'Parents don\u2019t need to type anything. They get a simple WhatsApp menu \u2014 tap to check fee status, view attendance, download report card, or contact the school. No confusion, no training needed.',
  },
  {
    icon: 'HeartIcon',
    title: 'Religion-Aware Greetings',
    body: 'Send Eid wishes to Muslim families, Diwali wishes to Hindu families, Christmas to Christian families \u2014 automatically. National holidays go to everyone. No manual sorting, no mix-ups.',
  },
  {
    icon: 'ArrowPathIcon',
    title: 'Works With Your Existing System',
    body: 'Using Tally? Excel sheets? An old ERP? We layer on top of whatever you have. No migration, no disruption, no learning curve. Your existing workflow stays untouched.',
  },
  {
    icon: 'CreditCardIcon',
    title: 'UPI + Bank Transfer Friendly',
    body: 'We include your school\u2019s UPI ID or bank details directly in WhatsApp reminders. Parents pay how they\u2019re comfortable \u2014 no app downloads, no new accounts needed.',
  },
  {
    icon: 'ShieldCheckIcon',
    title: '3-Level Escalation That Recovers Fees',
    body: 'Gentle reminder \u2192 Due date nudge \u2192 Formal notice with late fee. If all 3 fail, we compile a defaulter list and can escalate to secondary guardians. Clean reports, not sticky notes.',
  },
  {
    icon: 'NewspaperIcon',
    title: 'Daily Principal\u2019s Pulse Report',
    body: 'Every morning, the principal gets a WhatsApp summary: attendance %, fee collection status, pending actions, upcoming events. No logging into dashboards \u2014 the dashboard comes to you.',
  },
];

export default function BuiltForIndia() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 reveal">
          <span className="section-label mb-3 block">Made for India</span>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] leading-tight">
            Designed for How Indian Schools{' '}
            <span className="text-gradient-teal">Actually Work</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, i) => (
            <div
              key={item.title}
              className={`reveal ${i >= 3 ? 'delay-200' : i >= 1 ? 'delay-100' : ''}`}
            >
              <div className="h-full bg-white rounded-2xl border border-[#E2E8F0] p-7 transition-all hover:shadow-lg hover:border-[#0D9488]/30">
                <div className="w-11 h-11 rounded-xl bg-[#0D9488]/10 flex items-center justify-center mb-5">
                  <Icon name={item.icon} size={22} variant="outline" className="text-[#0D9488]" />
                </div>
                <h3 className="font-display text-lg font-700 text-[#1E3A5F] mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
