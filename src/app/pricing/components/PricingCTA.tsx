import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function PricingCTA() {
  return (
    <section className="py-20 bg-white" aria-label="Pricing page CTA">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
        <div className="bg-bg-base rounded-2xl border border-border p-12">
          <div className="inline-flex items-center gap-2 badge-teal rounded-full px-4 py-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal pulse-dot" />
            <span className="text-xs font-700 uppercase tracking-wider">Start Today</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-800 text-text-primary tracking-tight mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="text-text-secondary text-base leading-relaxed max-w-xl mx-auto mb-8">
            Book a free 20-minute demo. We&apos;ll understand your school&apos;s needs and recommend the best plan — no pressure, no commitment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange inline-flex items-center gap-2.5 px-8 py-4 text-base font-display"
            >
              <Icon name="CalendarIcon" size={18} variant="outline" />
              Book a Free Demo
            </a>
            <Link
              href="/features"
              className="btn-ghost inline-flex items-center gap-2 px-8 py-4 text-base"
            >
              Explore Features First
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-border">
            {[
              { icon: 'CalendarDaysIcon', text: '30-Day Free Trial' },
              { icon: 'ClockIcon', text: 'Live in under 48 hours' },
              { icon: 'CreditCardIcon', text: 'No credit card required' },
              { icon: 'PhoneIcon', text: 'Dedicated support included' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-text-secondary text-sm">
                <Icon name={item.icon as 'CalendarDaysIcon'} size={15} variant="outline" className="text-teal" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
