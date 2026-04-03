import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function FeaturesHero() {
  return (
    <section className="pt-28 pb-16 bg-primary relative overflow-hidden" aria-label="Features hero">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/homepage" className="text-white/50 hover:text-white/80 text-sm transition-colors">
              Home
            </Link>
            <Icon name="ChevronRightIcon" size={14} variant="outline" className="text-white/30" />
            <span className="text-white/80 text-sm">Features</span>
          </div>

          <div className="inline-flex items-center gap-2 badge-teal rounded-full px-4 py-2 mb-6">
            <Icon name="SparklesIcon" size={14} variant="outline" />
            <span className="text-xs font-700 uppercase tracking-wider">Platform Features</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-800 text-white leading-tight tracking-tight mb-6">
            Everything your school needs,{' '}
            <span className="text-teal-light">automated</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-2xl mb-8">
            From fee recovery to parent communication to operations intelligence — Relayra handles it all so your staff can focus on education.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange inline-flex items-center gap-2 px-6 py-3 text-sm font-display"
            >
              <Icon name="CalendarIcon" size={16} variant="outline" />
              Book a Free Demo
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white border border-white/25 rounded-btn hover:border-white/50 hover:bg-white/5 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-12">
          {[
            'Automated Fee Reminders',
            'Razorpay Integration',
            'WhatsApp Parent Menu',
            'AI Message Generation',
            'Attendance Tracking',
            'Daily Principal Reports',
            'Hinglish AI Support',
            'Multi-level Escalation',
          ]?.map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-1.5 bg-white/8 border border-white/12 rounded-full px-3.5 py-1.5 text-xs text-white/70 font-medium"
            >
              <Icon name="CheckIcon" size={11} variant="outline" className="text-teal-light" />
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}