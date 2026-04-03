import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function PricingHero() {
  return (
    <section className="pt-28 pb-16 bg-bg-base" aria-label="Pricing hero">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Link href="/homepage" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
            Home
          </Link>
          <Icon name="ChevronRightIcon" size={14} variant="outline" className="text-border" />
          <span className="text-text-primary text-sm font-medium">Pricing</span>
        </div>

        <div className="inline-flex items-center gap-2 badge-teal rounded-full px-4 py-2 mb-6">
          <Icon name="CurrencyRupeeIcon" size={14} variant="outline" />
          <span className="text-xs font-700 uppercase tracking-wider">Simple, Transparent Pricing</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-800 text-text-primary tracking-tight mb-6">
          Predictable pricing for every school
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto mb-4">
          No per-message charges. No hidden setup fees. Flat monthly plans with everything included — from WhatsApp templates to payment integration to ongoing support.
        </p>
        <p className="text-sm text-text-secondary">
          All prices in INR. Annual billing available with{' '}
          <span className="text-teal font-700">2 months free</span>.
        </p>
      </div>
    </section>
  );
}