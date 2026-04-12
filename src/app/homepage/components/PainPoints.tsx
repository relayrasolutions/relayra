'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

const painPoints = [
  {
    icon: 'BanknotesIcon',
    title: 'The Fee Black Hole',
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    body: 'Indian private schools lose 15–30% of expected fee revenue every quarter because reminders are manual, inconsistent, and easy to ignore. One phone call from the accounts office isn\u2019t enough. Parents forget, delay, or simply don\u2019t prioritize \u2014 and your school absorbs the loss silently.',
  },
  {
    icon: 'EnvelopeIcon',
    title: 'The Communication Dead Zone',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    body: 'Circulars go unread. SMS has under 20% open rates in India. Emails? Most parents never check them. Your important messages \u2014 fee dues, attendance alerts, exam schedules \u2014 are disappearing into a void. Meanwhile, parents check WhatsApp 30+ times a day.',
  },
  {
    icon: 'ClockIcon',
    title: 'The Admin Burnout Trap',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    body: 'Your office staff spends 2\u20133 hours daily making follow-up calls, sending individual messages, and tracking who paid. That\u2019s 60+ hours/month of manual work that could be eliminated \u2014 freeing your team to focus on what actually matters: running a great school.',
  },
];

export default function PainPoints() {
  return (
    <section className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 reveal">
          <span className="section-label mb-3 block">The Problem</span>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] leading-tight">
            Your School Is Losing Money Every Month{' '}
            <span className="text-gradient-teal">— And You Don&apos;t Even Know How Much</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {painPoints.map((item, i) => (
            <div
              key={item.title}
              className={`reveal ${i > 0 ? `delay-${i * 200}` : ''}`}
            >
              <div className={`h-full rounded-2xl border ${item.border} ${item.bg} p-7 transition-shadow hover:shadow-lg`}>
                <div className={`w-12 h-12 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center mb-5`}>
                  <Icon name={item.icon} size={24} variant="outline" className={item.color} />
                </div>
                <h3 className="font-display text-xl font-700 text-[#1E3A5F] mb-3">{item.title}</h3>
                <p className="text-[#475569] text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
