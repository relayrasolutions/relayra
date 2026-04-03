import React from 'react';
import Icon from '@/components/ui/AppIcon';

export default function GuaranteeSection() {
  return (
    <section className="py-16 bg-white" aria-label="Money-back guarantee">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="guarantee-banner p-10 md:p-14 relative overflow-hidden reveal">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}
          />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            {/* Shield icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Icon name="ShieldCheckIcon" size={48} variant="outline" className="text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/12 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-teal-light pulse-dot" />
                <span className="text-xs font-700 text-white/80 uppercase tracking-wider">Risk-Free Guarantee</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-800 text-white leading-tight mb-3">
                15% improvement in 3 months — or we refund every rupee.
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-xl">
                We're so confident in Relayra's impact that we back every deployment with a complete money-back guarantee. If your fee collection rate doesn't improve by at least 15% within 90 days, you get a full refund. No questions asked.
              </p>

              {/* Guarantee points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: 'CalendarDaysIcon', label: '90-day window', desc: 'Full quarter to see results' },
                  { icon: 'ChartBarIcon', label: '15% minimum', desc: 'Measurable, verified improvement' },
                  { icon: 'BanknotesIcon', label: 'Full refund', desc: 'Every rupee returned, no questions' },
                ].map((point) => (
                  <div key={point.label} className="flex items-start gap-3 bg-white/8 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <Icon name={point.icon as 'CalendarDaysIcon'} size={16} variant="outline" className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-700 text-sm">{point.label}</p>
                      <p className="text-white/60 text-xs mt-0.5">{point.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}