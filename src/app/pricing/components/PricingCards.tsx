'use client';
import React, { useState } from 'react';

import Icon from '@/components/ui/AppIcon';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 3999,
    annualPrice: 3333,
    description: 'For small schools getting started with automation',
    highlight: false,
    badge: null,
    features: [
      { text: 'Fee reminders + Razorpay payment links', included: true },
      { text: '3-level escalation system', included: true },
      { text: 'Auto-generated receipts via WhatsApp', included: true },
      { text: 'Attendance absence alerts', included: true },
      { text: 'Birthday & festive greetings', included: true },
      { text: 'Daily principal report (4 PM)', included: true },
      { text: 'WhatsApp parent menu', included: false },
      { text: 'AI message generation', included: false },
      { text: 'Full dashboard access', included: false },
      { text: 'Advanced analytics', included: false },
    ],
    cta: 'Get Started',
    ctaStyle: 'ghost',
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 7999,
    annualPrice: 6666,
    description: 'Most popular for mid-size schools',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'WhatsApp self-service parent menu', included: true },
      { text: 'Self-service document retrieval', included: true },
      { text: 'AI message generation', included: true },
      { text: 'Full analytics dashboard access', included: true },
      { text: 'Communication analytics', included: true },
      { text: 'Full AI parent concierge', included: false },
      { text: 'Multi-channel failsafe', included: false },
      { text: 'Custom reports', included: false },
      { text: 'Multi-branch support', included: false },
    ],
    cta: 'Get Started',
    ctaStyle: 'teal',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 14999,
    annualPrice: 12499,
    description: 'For schools wanting full AI capabilities',
    highlight: false,
    badge: null,
    features: [
      { text: 'Everything in Growth', included: true },
      { text: 'Full AI parent concierge (Hinglish)', included: true },
      { text: 'Advanced analytics & insights', included: true },
      { text: 'Multi-channel failsafe (WA → SMS → Email)', included: true },
      { text: 'Custom reports for management', included: true },
      { text: 'Priority support', included: true },
      { text: 'Built-in attendance ERP', included: false },
      { text: 'Multi-branch support', included: false },
      { text: 'Cross-school benchmarking', included: false },
      { text: 'Dedicated account manager', included: false },
    ],
    cta: 'Get Started',
    ctaStyle: 'primary',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 24999,
    annualPrice: 20833,
    description: 'For school groups and multi-branch institutions',
    highlight: false,
    badge: 'Enterprise',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Built-in attendance ERP', included: true },
      { text: 'Multi-branch support', included: true },
      { text: 'Cross-school benchmarking', included: true },
      { text: 'Custom reports & dashboards', included: true },
      { text: 'Priority 24/7 support', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'On-site training', included: true },
    ],
    cta: 'Contact Sales',
    ctaStyle: 'primary',
  },
];

export default function PricingCards() {
  const [isAnnual, setIsAnnual] = useState(false);

  const formatPrice = (price: number) =>
    `Rs. ${price.toLocaleString('en-IN')}`;

  return (
    <section className="pb-20 bg-bg-base" aria-label="Pricing plans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12 reveal">
          <span className={`text-sm font-600 transition-colors ${!isAnnual ? 'text-text-primary' : 'text-text-secondary'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal/40"
            style={{ background: isAnnual ? '#0D9488' : '#E2E8F0' }}
            aria-label="Toggle annual billing"
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
              style={{ transform: isAnnual ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
          <span className={`text-sm font-600 transition-colors ${isAnnual ? 'text-text-primary' : 'text-text-secondary'}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="inline-flex items-center gap-1 bg-success/12 text-success text-xs font-700 px-2.5 py-1 rounded-full">
              <Icon name="TagIcon" size={11} variant="solid" />
              2 months free
            </span>
          )}
        </div>

        {/* Top 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {plans.slice(0, 3).map((plan, i) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl p-7 reveal ${i > 0 ? `delay-${i * 150}` : ''} ${
                plan.highlight
                  ? 'bg-white pricing-highlight' :'bg-white card'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal text-white text-[10px] font-800 uppercase tracking-wider px-4 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              {/* Plan name & description */}
              <div className="mb-5">
                <h3 className="font-display font-800 text-text-primary text-xl mb-1">{plan.name}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-border">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-800 text-3xl text-text-primary">
                    {formatPrice(isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                  </span>
                  <span className="text-text-secondary text-sm">/month</span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-text-secondary mt-1.5">
                    Billed as{' '}
                    <span className="font-700 text-teal">
                      {formatPrice(plan.annualPrice * 10)}/year
                    </span>
                    {' '}— save {formatPrice((plan.monthlyPrice - plan.annualPrice) * 12)}
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-text-secondary' : 'text-text-secondary/40'}`}>
                    {f.included ? (
                      <Icon name="CheckIcon" size={16} variant="outline" className="text-teal flex-shrink-0 mt-0.5" />
                    ) : (
                      <Icon name="MinusIcon" size={16} variant="outline" className="text-border flex-shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? '' : 'line-through decoration-border/60'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+get+started+with+the+Relayra+Solutions"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 w-full py-3 text-sm font-600 rounded-btn transition-all ${
                  plan.ctaStyle === 'teal' ?'btn-teal text-white'
                    : plan.ctaStyle === 'primary' ?'btn-primary text-white' :'btn-ghost'
                }`}
              >
                {plan.cta}
                <Icon name="ArrowRightIcon" size={14} variant="outline" />
              </a>
            </div>
          ))}
        </div>

        {/* Enterprise — full width */}
        {(() => {
          const plan = plans[3];
          return (
            <div className="bg-primary rounded-xl p-8 reveal delay-300 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
              />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-5 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)', transform: 'translateY(40%)' }}
              />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Left: Plan info */}
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 mb-4">
                    <Icon name="BuildingOffice2Icon" size={13} variant="outline" className="text-teal-light" />
                    <span className="text-xs font-700 text-white/80 uppercase tracking-wider">Enterprise</span>
                  </div>
                  <h3 className="font-display font-800 text-white text-2xl mb-2">{plan.name}</h3>
                  <p className="text-white/60 text-sm mb-5">{plan.description}</p>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="font-display font-800 text-3xl text-white">
                      {formatPrice(isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                    </span>
                    <span className="text-white/50 text-sm">/month</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-white/50">
                      Billed as {formatPrice(plan.annualPrice * 10)}/year
                    </p>
                  )}
                </div>

                {/* Middle: Features */}
                <div className="lg:col-span-1">
                  <div className="grid grid-cols-2 gap-2">
                    {plan.features.slice(0, 8).map((f) => (
                      <div key={f.text} className="flex items-center gap-2">
                        <Icon name="CheckCircleIcon" size={14} variant="solid" className="text-teal-light flex-shrink-0" />
                        <span className="text-white/80 text-xs">{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: CTA */}
                <div className="flex flex-col gap-3 lg:items-end">
                  <a
                    href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27m+interested+in+the+Relayra+Enterprise+plan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-orange inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-display whitespace-nowrap"
                  >
                    <Icon name="PhoneIcon" size={16} variant="outline" />
                    Contact Sales
                  </a>
                  <p className="text-white/50 text-xs text-center lg:text-right">
                    Custom pricing available for 10+ branches
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Trial badge */}
        <div className="mt-10 mb-6 text-center reveal delay-350">
          <div className="inline-flex items-center gap-3 bg-teal/10 border border-teal/20 rounded-full px-6 py-3">
            <svg className="w-5 h-5 text-teal flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-700 text-teal">All plans include a 30-Day Free Trial — no credit card required</span>
          </div>
        </div>

        {/* Included in all plans */}
        <div className="bg-white rounded-xl border border-border p-8 reveal delay-400">
          <h3 className="font-display font-700 text-text-primary text-base mb-6 text-center">
            Included in every plan — no extra charges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { icon: 'WrenchScrewdriverIcon', label: 'Full setup by our team' },
              { icon: 'ChatBubbleLeftRightIcon', label: 'WhatsApp integration' },
              { icon: 'CreditCardIcon', label: 'Razorpay integration' },
              { icon: 'UserGroupIcon', label: 'Unlimited students' },
              { icon: 'PhoneIcon', label: 'Support included' },
              { icon: 'ArrowPathIcon', label: 'Free updates' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal/8 flex items-center justify-center">
                  <Icon name={item.icon as 'WrenchScrewdriverIcon'} size={18} variant="outline" className="text-teal" />
                </div>
                <span className="text-text-secondary text-xs leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}