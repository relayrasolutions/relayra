import React from 'react';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';

/*
  Bento Grid Audit — 2-column grid on desktop:
  Row 1: [Revenue Engine col-span-1] + [Smart Communication col-span-1] = 2/2 ✓
  Row 2: [Operations Intelligence col-span-1] + [CTA Card col-span-1] = 2/2 ✓
*/

const features = [
  {
    id: 'revenue',
    label: 'Revenue Engine',
    title: 'Fee collection on autopilot',
    description:
      'Automated multi-level fee reminders, Razorpay payment links, escalation sequences, and instant receipts — all via WhatsApp. No manual follow-ups ever again.',
    icon: 'BanknotesIcon',
    iconBg: 'bg-teal/10',
    iconColor: 'text-teal',
    glowClass: 'icon-glow-teal',
    highlights: [
      '5-level escalation system',
      'Smart timing (skips weekends & holidays)',
      'UPI, cards, netbanking via Razorpay',
      'Auto-generated receipts',
    ],
    accent: '#0D9488',
    stat: { value: '+43%', label: 'avg. collection rate improvement' },
  },
  {
    id: 'communication',
    label: 'Smart Communication',
    title: 'Your entire school in parents\' WhatsApp',
    description:
      'AI-powered notices, emergency broadcasts, and a two-way parent menu. Parents can check fees, attendance, exam results, and more — without calling the school.',
    icon: 'ChatBubbleLeftRightIcon',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    glowClass: 'icon-glow-blue',
    highlights: [
      'AI understands Hindi, English & Hinglish',
      'Instant responses under 5 seconds',
      'Self-service parent menu',
      'Emergency broadcast to all parents',
    ],
    accent: '#1E3A5F',
    stat: { value: '98%', label: 'WhatsApp message delivery rate' },
  },
  {
    id: 'operations',
    label: 'Operations Intelligence',
    title: 'Daily principal reports at 4 PM',
    description:
      'Attendance tracking, daily automated summaries, analytics dashboard, and class-wise performance insights — delivered directly to the principal\'s WhatsApp.',
    icon: 'ChartBarIcon',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent-dark',
    glowClass: 'icon-glow-orange',
    highlights: [
      'Automated 4 PM daily summary',
      'Consecutive absence alerts',
      'Real-time analytics dashboard',
      'Month-over-month comparisons',
    ],
    accent: '#F59E0B',
    stat: { value: '3 days', label: 'average setup time' },
  },
];

export default function FeatureBento() {
  return (
    <section className="py-20 lg:py-28 bg-bg-base" aria-label="Platform features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <p className="section-label mb-3">Platform Features</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-800 text-text-primary tracking-tight mb-4">
            Three pillars that run{' '}
            <span className="text-gradient-blue">your school</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Not a tool you have to learn. A managed service that delivers results from day one.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1 */}
          {features.slice(0, 2).map((feature, i) => (
            <div
              key={feature.id}
              className={`bento-card p-8 reveal ${i === 1 ? 'delay-200' : ''}`}
            >
              {/* Icon + Label */}
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center ${feature.glowClass}`}>
                  <Icon name={feature.icon as 'BanknotesIcon'} size={24} variant="outline" className={feature.iconColor} />
                </div>
                <span
                  className="text-xs font-700 uppercase tracking-wider px-3 py-1 rounded-full"
                  style={{ background: `${feature.accent}15`, color: feature.accent }}
                >
                  {feature.label}
                </span>
              </div>

              <h3 className="font-display text-xl font-700 text-text-primary mb-3 leading-tight">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                {feature.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2 mb-6">
                {feature.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: `${feature.accent}18` }}
                    >
                      <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                        <path d="M2 6l3 3 5-5" stroke={feature.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {h}
                  </li>
                ))}
              </ul>

              {/* Stat */}
              <div
                className="flex items-center gap-3 pt-5 mt-auto border-t border-border"
              >
                <span className="font-display font-800 text-2xl" style={{ color: feature.accent }}>
                  {feature.stat.value}
                </span>
                <span className="text-xs text-text-secondary">{feature.stat.label}</span>
              </div>
            </div>
          ))}

          {/* Row 2 */}
          <div className="bento-card p-8 reveal delay-100">
            {/* Operations */}
            {(() => {
              const feature = features[2];
              return (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center ${feature.glowClass}`}>
                      <Icon name={feature.icon as 'ChartBarIcon'} size={24} variant="outline" className={feature.iconColor} />
                    </div>
                    <span
                      className="text-xs font-700 uppercase tracking-wider px-3 py-1 rounded-full"
                      style={{ background: `${feature.accent}15`, color: feature.accent }}
                    >
                      {feature.label}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-700 text-text-primary mb-3 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {feature.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                          style={{ background: `${feature.accent}18` }}
                        >
                          <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                            <path d="M2 6l3 3 5-5" stroke={feature.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3 pt-5 mt-auto border-t border-border">
                    <span className="font-display font-800 text-2xl" style={{ color: feature.accent }}>
                      {feature.stat.value}
                    </span>
                    <span className="text-xs text-text-secondary">{feature.stat.label}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* CTA Card */}
          <div className="bento-card overflow-hidden reveal delay-300 animated-gradient relative flex flex-col justify-between p-8 min-h-[280px]">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-light pulse-dot"></span>
                <span className="text-xs font-600 text-white/90">Risk-Free Guarantee</span>
              </div>
              <h3 className="font-display text-2xl font-800 text-white leading-tight mb-3">
                15% improvement in 3 months or full refund.
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                We're so confident in our results that we back every deployment with a complete money-back guarantee.
              </p>
            </div>
            <div className="relative z-10 mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-orange inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-display"
              >
                <Icon name="CalendarIcon" size={16} variant="outline" />
                Book Free Demo
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white border border-white/25 rounded-btn hover:border-white/50 hover:bg-white/5 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom link */}
        <div className="text-center mt-10 reveal delay-400">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-teal font-600 text-sm hover:text-teal-dark transition-colors group"
          >
            Explore all features in detail
            <Icon name="ArrowRightIcon" size={16} variant="outline" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}