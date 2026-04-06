'use client';
import React, { useState } from 'react';

const levels = [
  {
    level: 1,
    title: 'The Helpful Heads-Up',
    timing: '7 Days Before Due Date',
    color: '#0D9488',
    bg: 'bg-teal-50',
    borderColor: 'border-teal-200',
    message:
      'Dear Parent, a gentle heads-up that Rohan\'s Q2 fee will be due next week on [Date]. You can easily pay in advance via UPI here: [Link]',
  },
  {
    level: 2,
    title: 'The Due Date Nudge',
    timing: 'On the Due Date',
    color: '#F59E0B',
    bg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    message:
      'Hi, today is the final day to clear Rohan\'s Q2 fee to avoid late charges. Please complete the payment today via our secure link: [Link]',
  },
  {
    level: 3,
    title: 'The Formal Escalation',
    timing: '5 Days Post-Due Date',
    color: '#EF4444',
    bg: 'bg-red-50',
    borderColor: 'border-red-200',
    message:
      'Important: Rohan\'s Q2 fee is now 5 days overdue. A late fee penalty of Rs. [Amount] has been applied to the account. Please clear the updated balance as soon as possible.',
  },
];

const failsafes = [
  {
    title: 'Critical Defaulter Hand-Off',
    description:
      'Relayra stops messaging the parent to avoid spamming, and automatically compiles a Defaulter List sent directly to your admin team. Your staff knows exactly who to call without wasting hours cross-checking Excel sheets.',
    icon: '📋',
  },
  {
    title: 'Secondary Contact Escalation',
    description:
      'If the primary contact ignores all 3 steps, Relayra automatically triggers a final alert to the secondary guardian\'s phone number on file.',
    icon: '📱',
  },
  {
    title: 'Digital Withhold Leverage',
    description:
      'Relayra lets schools automatically pause digital delivery of report cards and exam schedules to parents with critically overdue balances until payment is cleared.',
    icon: '🔒',
  },
];

export default function EscalationSection() {
  const [expandedFaq, setExpandedFaq] = useState(false);

  return (
    <section className="py-20 lg:py-28 bg-bg-base" aria-label="Escalation system">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <p className="text-xs font-700 uppercase tracking-wider text-teal mb-3">Smart Fee Recovery</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-800 text-text-primary tracking-tight mb-4">
            3-Level Automated{' '}
            <span className="text-gradient-teal">Escalation System</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Every message is timed, toned, and delivered automatically via WhatsApp. You never have to chase a parent.
          </p>
        </div>

        {/* 3 Levels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {levels.map((level) => (
            <div
              key={level.level}
              className={`rounded-2xl border-2 ${level.borderColor} ${level.bg} p-6 relative overflow-hidden reveal`}
            >
              {/* Level badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 text-white text-xs font-700"
                style={{ backgroundColor: level.color }}
              >
                Level {level.level}
              </div>

              <h3 className="font-display text-lg font-700 text-[#1E293B] mb-1">
                {level.title}
              </h3>
              <p className="text-sm font-600 mb-4" style={{ color: level.color }}>
                {level.timing}
              </p>

              {/* WhatsApp message preview */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-medium">WhatsApp Message</span>
                </div>
                <p className="text-xs text-[#1E293B] leading-relaxed italic">
                  &ldquo;{level.message}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ: What if parent ignores all three? */}
        <div className="max-w-3xl mx-auto reveal">
          <button
            onClick={() => setExpandedFaq(!expandedFaq)}
            className="w-full bg-white rounded-2xl border border-[#E2E8F0] p-6 text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-700 text-[#1E293B]">
                What if a parent ignores all three reminders?
              </h3>
              <svg
                className={`w-5 h-5 text-[#64748B] transition-transform duration-300 flex-shrink-0 ml-4 ${
                  expandedFaq ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {expandedFaq && (
              <div className="mt-4 pt-4 border-t border-[#E2E8F0]" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
                  Relayra handles the heavy lifting so your school maintains its relationship with parents. For the rare cases that require intervention, our system deploys three fail-safes:
                </p>

                <div className="space-y-4">
                  {failsafes.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]"
                    >
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <div>
                        <h4 className="font-display font-700 text-sm text-[#1E293B] mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
