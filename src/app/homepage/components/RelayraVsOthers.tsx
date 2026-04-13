'use client';

import React from 'react';

const features = [
  { label: 'Fee reminders', erp: 'Manual', relayra: '3-level automated escalation' },
  { label: 'WhatsApp delivery', erp: 'No', relayra: '95%+ open rates' },
  { label: 'Attendance alerts to parents', erp: 'Most don\u2019t have', relayra: 'Instant WhatsApp alerts' },
  { label: 'Setup effort from school', erp: 'High \u2014 weeks of training', relayra: 'Zero \u2014 we do everything' },
  { label: 'Ongoing management', erp: 'School manages itself', relayra: 'Fully managed by us' },
  { label: 'Parent communication', erp: 'One-way notices', relayra: 'Two-way WhatsApp' },
  { label: 'Birthday / Festival wishes', erp: 'No', relayra: 'Automated' },
  { label: 'Daily admin reports', erp: 'Manual', relayra: 'Auto-generated "Principal\u2019s Pulse"' },
  { label: 'Cost', erp: '\u20B950K\u20132L/year', relayra: 'From \u20B93,999/month' },
];

function Badge({ works }: { works: boolean }) {
  return works ? (
    <span className="inline-flex items-center gap-1 text-[#0D9488] font-600">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-400 font-600">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
}

function CellContent({ text, isRelayra }: { text: string; isRelayra: boolean }) {
  const isNegative = ['No', 'Manual', 'No reminders', 'One-way notices'].includes(text) ||
    text.startsWith('Most don') || text.startsWith('High') || text.startsWith('Medium') ||
    text.startsWith('School manages');

  return (
    <div className="flex items-start gap-2">
      {isRelayra ? <Badge works /> : isNegative ? <Badge works={false} /> : null}
      <span className={`text-sm ${isRelayra ? 'text-[#0D9488] font-600' : isNegative ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
        {text}
      </span>
    </div>
  );
}

export default function RelayraVsOthers() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 reveal">
          <span className="section-label mb-3 block">Why Relayra</span>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] leading-tight">
            We&apos;re Not Another School Software.{' '}
            <span className="text-gradient-teal">We&apos;re Your Operations Team on WhatsApp.</span>
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block reveal delay-100">
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F1F5F9]">
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#1E3A5F] w-[30%]">Feature</th>
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#64748B] w-[35%]">Typical School ERP</th>
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#0D9488] w-[35%]">
                    Relayra
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f.label} className={`border-t border-[#E2E8F0] ${i % 2 === 0 ? '' : 'bg-[#FAFBFC]'}`}>
                    <td className="px-6 py-4 text-sm font-600 text-[#1E293B]">{f.label}</td>
                    <td className="px-6 py-4"><CellContent text={f.erp} isRelayra={false} /></td>
                    <td className="px-6 py-4 bg-teal-50/40"><CellContent text={f.relayra} isRelayra /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4 reveal delay-100">
          {features.map((f) => (
            <div key={f.label} className="rounded-xl border border-[#E2E8F0] p-4">
              <p className="text-sm font-700 text-[#1E3A5F] mb-3">{f.label}</p>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-[#94A3B8] w-20 shrink-0">ERP</span>
                  <CellContent text={f.erp} isRelayra={false} />
                </div>
                <div className="flex items-start justify-between gap-2 bg-teal-50/50 -mx-2 px-2 py-1 rounded">
                  <span className="text-xs text-[#0D9488] w-20 shrink-0 font-600">Relayra</span>
                  <CellContent text={f.relayra} isRelayra />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
