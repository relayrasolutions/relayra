import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function FeaturesCTA() {
  return (
    <section className="py-20 bg-white" aria-label="Features page CTA">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="reveal">
          <div className="inline-flex items-center gap-2 badge-teal rounded-full px-4 py-2 mb-6">
            <Icon name="SparklesIcon" size={14} variant="outline" />
            <span className="text-xs font-700 uppercase tracking-wider">Get Started Today</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-800 text-text-primary tracking-tight mb-6">
            Ready to put your school&apos;s operations on autopilot?
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Start your 30-Day Free Trial and see how Relayra automates fee collection, parent communication, and daily operations. Setup in under 48 hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange inline-flex items-center gap-2.5 px-8 py-4 text-base font-display"
            >
              <Icon name="CalendarIcon" size={18} variant="outline" />
              Start Free Trial
            </a>
            <Link
              href="/pricing"
              className="btn-ghost inline-flex items-center gap-2 px-8 py-4 text-base"
            >
              View Pricing Plans
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: 'CalendarDaysIcon', text: '30-Day Free Trial' },
              { icon: 'ClockIcon', text: 'Setup in under 48 hours' },
              { icon: 'CreditCardIcon', text: 'No credit card required' },
              { icon: 'PhoneIcon', text: 'Dedicated support included' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-text-secondary text-sm">
                <Icon name={item.icon as 'CalendarDaysIcon'} size={16} variant="outline" className="text-teal" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
