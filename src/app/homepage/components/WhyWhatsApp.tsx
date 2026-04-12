'use client';

import React from 'react';

const channels = [
  {
    name: 'Email',
    openRate: '18–22%',
    openPct: 20,
    responseTime: 'Hours / Days',
    verdict: 'Most parents don\u2019t check',
    works: false,
  },
  {
    name: 'SMS',
    openRate: '10–20%',
    openPct: 15,
    responseTime: 'Often ignored',
    verdict: 'Lost in spam / promotions',
    works: false,
  },
  {
    name: 'Phone Calls',
    openRate: 'N/A',
    openPct: 0,
    responseTime: '30 sec pickup',
    verdict: 'Intrusive, not scalable',
    works: false,
  },
  {
    name: 'WhatsApp',
    openRate: '95–98%',
    openPct: 97,
    responseTime: 'Under 3 minutes',
    verdict: 'Already used 30+ times/day',
    works: true,
  },
];

export default function WhyWhatsApp() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 reveal">
          <span className="section-label mb-3 block">The Right Channel</span>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] leading-tight">
            Why WhatsApp?{' '}
            <span className="text-gradient-teal">Because It&apos;s Where Indian Parents Actually Are</span>
          </h2>
        </div>

        {/* Comparison Table */}
        <div className="reveal delay-100">
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-[#E2E8F0]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F1F5F9]">
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#1E3A5F]">Channel</th>
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#1E3A5F]">Open Rate</th>
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#1E3A5F]">Response Time</th>
                  <th className="text-left px-6 py-4 text-sm font-700 text-[#1E3A5F]">Works for Parents?</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch, i) => (
                  <tr
                    key={ch.name}
                    className={`border-t border-[#E2E8F0] ${ch.works ? 'bg-teal-50/50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <span className={`text-sm font-600 ${ch.works ? 'text-[#0D9488]' : 'text-[#1E293B]'}`}>
                        {ch.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${ch.works ? 'bg-[#0D9488]' : 'bg-[#94A3B8]'}`}
                            style={{ width: `${ch.openPct}%` }}
                          />
                        </div>
                        <span className={`text-sm font-600 ${ch.works ? 'text-[#0D9488]' : 'text-[#64748B]'}`}>
                          {ch.openRate}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{ch.responseTime}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${ch.works ? '' : ''}`}>{ch.works ? '\u2705' : '\u274C'}</span>
                        <span className="text-sm text-[#64748B]">{ch.verdict}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {channels.map((ch) => (
              <div
                key={ch.name}
                className={`rounded-xl border p-5 ${ch.works ? 'border-[#0D9488] bg-teal-50/50' : 'border-[#E2E8F0] bg-white'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-base font-700 ${ch.works ? 'text-[#0D9488]' : 'text-[#1E293B]'}`}>
                    {ch.name}
                  </span>
                  <span className="text-lg">{ch.works ? '\u2705' : '\u274C'}</span>
                </div>
                <div className="space-y-2 text-sm text-[#64748B]">
                  <div className="flex justify-between">
                    <span>Open Rate</span>
                    <span className={`font-600 ${ch.works ? 'text-[#0D9488]' : ''}`}>{ch.openRate}</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ch.works ? 'bg-[#0D9488]' : 'bg-[#94A3B8]'}`}
                      style={{ width: `${ch.openPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time</span>
                    <span className="font-600">{ch.responseTime}</span>
                  </div>
                  <p className="text-xs pt-1">{ch.verdict}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight box */}
        <div className="mt-10 reveal delay-200">
          <div className="bg-[#1E3A5F] rounded-2xl p-8 text-center">
            <p className="text-white text-lg sm:text-xl font-600 leading-relaxed max-w-2xl mx-auto">
              India has <span className="text-[#5EEAD4] font-800">600+ million</span> WhatsApp users.
              For school communication, it&apos;s not a choice — it&apos;s the only channel that works.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
