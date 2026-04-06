import React from 'react';
import Icon from '@/components/ui/AppIcon';

export default function GuaranteeSection() {
  return (
    <section className="py-16 bg-white" aria-label="30-day free trial">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="guarantee-banner p-10 md:p-14 relative overflow-hidden reveal">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-8 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}
          />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            {/* Shield icon */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                <Icon name="CalendarDaysIcon" size={48} variant="outline" className="text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/12 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-teal-light pulse-dot" />
                <span className="text-xs font-700 text-white/80 uppercase tracking-wider">Try Before You Pay</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-800 text-white leading-tight mb-3">
                30-Day Free Trial — no credit card required.
              </h2>
              <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-xl">
                We set up Relayra with your real school data. You get full access to everything for 30 days — fee reminders, parent communication, attendance tracking, daily reports. If you love it, pick a plan. If not, walk away with zero obligation.
              </p>

              {/* Trial points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {[
                  { icon: 'RocketLaunchIcon', label: 'Full access', desc: 'Every feature unlocked for 30 days' },
                  { icon: 'CreditCardIcon', label: 'No card required', desc: 'Start your trial without payment' },
                  { icon: 'UserGroupIcon', label: 'Real data setup', desc: 'We configure your actual school' },
                ].map((point) => (
                  <div key={point.label} className="flex items-start gap-3 bg-white/8 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                      <Icon name={point.icon as 'RocketLaunchIcon'} size={16} variant="outline" className="text-white" />
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
