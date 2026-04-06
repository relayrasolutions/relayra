import React from 'react';
import Icon from '@/components/ui/AppIcon';

const escalationLevels = [
  { level: 1, tone: 'The Helpful Heads-Up', color: '#0D9488', delay: '7 Days Before', message: 'Dear Parent, a gentle heads-up that Rohan\'s Q2 fee will be due next week on [Date]. You can easily pay in advance via UPI here: [Link]' },
  { level: 2, tone: 'The Due Date Nudge', color: '#F59E0B', delay: 'Due Date', message: 'Hi, today is the final day to clear Rohan\'s Q2 fee to avoid late charges. Please complete the payment today via our secure link: [Link]' },
  { level: 3, tone: 'The Formal Escalation', color: '#EF4444', delay: '5 Days After', message: 'Important: Rohan\'s Q2 fee is now 5 days overdue. A late fee penalty of Rs. [Amount] has been applied. Please clear the updated balance as soon as possible.' },
];

const paymentFeatures = [
  { icon: 'CreditCardIcon', title: 'UPI, Cards & Netbanking', desc: 'Full Razorpay integration for all payment methods' },
  { icon: 'ReceiptRefundIcon', title: 'Instant Auto-Receipts', desc: 'PDF receipts sent via WhatsApp immediately after payment' },
  { icon: 'CalendarDaysIcon', title: 'Smart Scheduling', desc: 'Skips weekends, public holidays, and exam periods automatically' },
  { icon: 'ChartPieIcon', title: 'Collection Analytics', desc: 'Track rates by class, student, and fee type in real time' },
];

export default function RevenueEngineSection() {
  return (
    <section className="py-20 lg:py-28 bg-bg-base" aria-label="Revenue engine features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-16 reveal">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/20 rounded-full px-4 py-1.5 mb-4">
              <Icon name="BanknotesIcon" size={14} variant="outline" className="text-teal" />
              <span className="text-xs font-700 text-teal uppercase tracking-wider">Revenue Engine</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-800 text-text-primary tracking-tight mb-4">
              Fee collection that works while you sleep
            </h2>
            <p className="text-text-secondary text-base leading-relaxed">
              A 3-level automated escalation system that progresses from gentle reminders to formal notices — all via WhatsApp, all without any manual intervention.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white rounded-xl border border-border p-5 shadow-card flex-shrink-0">
            <div className="text-center">
              <div className="font-display font-800 text-3xl text-teal">3-Level</div>
              <div className="text-xs text-text-secondary mt-1">Smart escalation<br />system</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="font-display font-800 text-3xl text-primary">0</div>
              <div className="text-xs text-text-secondary mt-1">Manual follow-ups<br />required</div>
            </div>
          </div>
        </div>

        {/* Escalation System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left: Escalation levels */}
          <div className="reveal-left">
            <h3 className="font-display text-xl font-700 text-text-primary mb-6">
              3-Level Escalation System
            </h3>
            <div className="space-y-3">
              {escalationLevels.map((level) => (
                <div
                  key={level.level}
                  className="bg-white rounded-xl border border-border p-4 hover:border-teal/30 hover:shadow-card transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-800 font-mono-display"
                      style={{ background: level.color }}
                    >
                      {level.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-700 text-text-primary text-sm">{level.tone}</span>
                        <span
                          className="text-xs font-600 px-2 py-0.5 rounded-full"
                          style={{ background: `${level.color}15`, color: level.color }}
                        >
                          {level.delay}
                        </span>
                      </div>
                      <p className="text-text-secondary text-xs leading-relaxed">
                        &ldquo;{level.message}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Payment features */}
          <div className="reveal-right">
            <h3 className="font-display text-xl font-700 text-text-primary mb-6">
              Razorpay-Powered Payments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {paymentFeatures.map((f) => (
                <div key={f.title} className="bg-white rounded-xl border border-border p-5 hover:border-teal/30 hover:shadow-card transition-all">
                  <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center mb-3">
                    <Icon name={f.icon as 'CreditCardIcon'} size={20} variant="outline" className="text-teal" />
                  </div>
                  <h4 className="font-display font-700 text-text-primary text-sm mb-1">{f.title}</h4>
                  <p className="text-text-secondary text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* WhatsApp payment flow mockup */}
            <div className="bg-[#ECE5DD] rounded-2xl p-5 border border-[#D1C4B0]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#D1C4B0]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs font-700">RS</span>
                </div>
                <div>
                  <p className="text-xs font-700 text-[#1a1a1a]">Relayra School</p>
                  <p className="text-[10px] text-[#667781]">Verified Business</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl rounded-tl-sm p-3 max-w-[85%] shadow-sm">
                  <p className="text-xs text-[#1a1a1a] leading-relaxed">
                    Dear <strong>Mrs. Priya Mehta</strong>, Rs. 8,500 fees for <strong>Aryan (Class 7-B)</strong> are due for March. Pay securely:
                  </p>
                  <div className="mt-2 bg-teal rounded-lg p-2 text-center">
                    <p className="text-white text-xs font-700">Pay Rs. 8,500 Now</p>
                  </div>
                  <p className="text-[10px] text-[#667781] mt-1.5 text-right">09:15 AM</p>
                </div>
                <div className="bg-[#D9FDD3] rounded-xl rounded-tr-sm p-3 max-w-[85%] ml-auto shadow-sm">
                  <p className="text-xs text-[#1a1a1a]">Payment of Rs. 8,500 received. Receipt sent.</p>
                  <p className="text-[10px] text-[#667781] mt-1 text-right">09:23 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stat banner */}
        <div className="bg-primary rounded-2xl p-8 text-center reveal delay-200">
          <p className="text-white/60 text-sm font-600 uppercase tracking-wider mb-2">Why Relayra?</p>
          <p className="font-display font-800 text-white text-2xl sm:text-3xl">
            Automate fee collection with a <span className="text-teal-light">3-level smart escalation</span> system — zero manual follow-ups
          </p>
        </div>
      </div>
    </section>
  );
}
