import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const tiers = [
  {
    name: 'Starter',
    price: 'Rs. 3,999',
    period: '/month',
    description: 'Perfect for small schools getting started',
    highlight: false,
    features: ['Fee reminders + payment links', 'Escalation system', 'Auto-receipts', 'Attendance alerts'],
  },
  {
    name: 'Growth',
    price: 'Rs. 7,999',
    period: '/month',
    description: 'Most popular for growing schools',
    highlight: true,
    badge: 'Most Popular',
    features: ['Everything in Starter', 'WhatsApp parent menu', 'AI message generation', 'Full dashboard access'],
  },
  {
    name: 'Pro',
    price: 'Rs. 14,999',
    period: '/month',
    description: 'For schools wanting full AI capabilities',
    highlight: false,
    features: ['Everything in Growth', 'Full AI parent concierge', 'Advanced analytics', 'Multi-channel failsafe'],
  },
];

export default function PricingTeaser() {
  return (
    <section className="py-20 lg:py-28 bg-white" aria-label="Pricing overview">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <p className="section-label mb-3">Simple Pricing</p>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-text-primary tracking-tight mb-4">
            Transparent pricing for every school
          </h2>
          <p className="text-text-secondary text-lg">
            No hidden fees. No per-message charges. Flat monthly plans that scale with you.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {tiers?.map((tier, i) => (
            <div
              key={tier?.name}
              className={`relative rounded-xl p-7 flex flex-col reveal ${i > 0 ? `delay-${i * 150}` : ''} ${
                tier?.highlight
                  ? 'pricing-highlight bg-white' :'card bg-white'
              }`}
            >
              {tier?.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal text-white text-[10px] font-800 uppercase tracking-wider px-4 py-1 rounded-full">
                  {tier?.badge}
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-display font-700 text-text-primary text-lg mb-1">{tier?.name}</h3>
                <p className="text-text-secondary text-xs mb-4">{tier?.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display font-800 text-3xl text-text-primary">{tier?.price}</span>
                  <span className="text-text-secondary text-sm">{tier?.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {tier?.features?.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Icon name="CheckIcon" size={16} variant="outline" className="text-teal flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className={`w-full text-center py-3 text-sm font-600 rounded-btn transition-all ${
                  tier?.highlight
                    ? 'btn-teal text-white' :'btn-ghost text-text-primary'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* View full pricing */}
        <div className="text-center mt-8 reveal delay-400">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-teal font-600 text-sm hover:text-teal-dark transition-colors group"
          >
            View full pricing and feature comparison
            <Icon name="ArrowRightIcon" size={16} variant="outline" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}