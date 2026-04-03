import React from 'react';
import Icon from '@/components/ui/AppIcon';

const steps = [
  {
    number: '01',
    icon: 'TableCellsIcon',
    title: 'You give us a spreadsheet',
    description:
      'Share your student data in any format — Excel, CSV, or even a WhatsApp photo of a register. Our team handles the rest.',
    detail: 'Student names, parent contacts, fee structure, class info',
    color: '#1E3A5F',
    bg: 'bg-primary/8',
  },
  {
    number: '02',
    icon: 'CogIcon',
    title: 'We set everything up',
    description:
      'Our team configures your entire system — fee schedules, WhatsApp templates, escalation rules, and reporting. Zero effort from you.',
    detail: 'Typically done in 3 working days',
    color: '#0D9488',
    bg: 'bg-teal/8',
  },
  {
    number: '03',
    icon: 'ArrowTrendingUpIcon',
    title: 'Your revenue recovers itself',
    description:
      'Automated reminders go out, parents pay via WhatsApp, receipts are sent, and you get a daily report at 4 PM. Completely hands-off.',
    detail: 'Average 43% improvement in collection rates',
    color: '#F59E0B',
    bg: 'bg-accent/8',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white scroll-mt-20" aria-label="How it works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <p className="section-label mb-3">Simple Process</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-800 text-text-primary tracking-tight mb-4">
            From spreadsheet to{' '}
            <span className="text-gradient-teal">automated system</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            No technical training. No complex setup. We do the work, you see the results.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector lines (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-primary/20 via-teal/40 to-accent/20 pointer-events-none" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative text-center reveal ${index > 0 ? `delay-${index * 200}` : ''}`}
            >
              {/* Step number + icon */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className={`relative w-20 h-20 rounded-2xl ${step.bg} flex items-center justify-center mb-4 transition-all duration-300 hover:scale-110`}
                  style={{ boxShadow: `0 8px 24px ${step.color}20` }}
                >
                  <Icon
                    name={step.icon as 'TableCellsIcon'}
                    size={32}
                    variant="outline"
                    className="transition-transform"
                    style={{ color: step.color } as React.CSSProperties}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-800 text-white font-mono-display"
                    style={{ background: step.color }}
                  >
                    {step.number}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-700 text-text-primary mb-3">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-4 max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Detail pill */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600"
                style={{ background: `${step.color}12`, color: step.color }}
              >
                <Icon name="CheckCircleIcon" size={12} variant="solid" />
                {step.detail}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14 reveal delay-400">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-bg-base border border-border rounded-2xl px-8 py-6">
            <div className="text-left">
              <p className="font-display font-700 text-text-primary text-sm mb-0.5">
                Ready to see it in action?
              </p>
              <p className="text-text-secondary text-xs">
                Book a 20-minute live demo — no commitment required.
              </p>
            </div>
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange inline-flex items-center gap-2 px-6 py-3 text-sm font-display flex-shrink-0"
            >
              <Icon name="CalendarIcon" size={16} variant="outline" />
              Book Free Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}