import React from 'react';
import Icon from '@/components/ui/AppIcon';

const reportItems = [
  { label: 'Present today', value: '847 / 912', icon: 'UserGroupIcon', color: '#10B981', trend: '+12 vs yesterday' },
  { label: 'Fees collected', value: 'Rs. 1,24,500', icon: 'BanknotesIcon', color: '#0D9488', trend: '+23% vs last week' },
  { label: 'Parent queries', value: '34 resolved', icon: 'ChatBubbleLeftRightIcon', color: '#1E3A5F', trend: '2 pending escalation' },
  { label: 'Critical alerts', value: '3 absences', icon: 'ExclamationTriangleIcon', color: '#F59E0B', trend: 'Riya, Arjun, Meera' },
];

const attendanceMethods = [
  { title: 'Manual Entry', desc: 'Teachers mark attendance on any device', icon: 'PencilSquareIcon' },
  { title: 'Excel Upload', desc: 'Bulk upload attendance from existing sheets', icon: 'ArrowUpTrayIcon' },
  { title: 'Teacher App', desc: 'Mobile-first attendance marking interface', icon: 'DevicePhoneMobileIcon' },
];

export default function OperationsSection() {
  return (
    <section className="py-20 lg:py-28 bg-bg-base" aria-label="Operations intelligence features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-4">
            <Icon name="ChartBarIcon" size={14} variant="outline" className="text-accent-dark" />
            <span className="text-xs font-700 text-accent-dark uppercase tracking-wider">Operations Intelligence</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-text-primary tracking-tight mb-4">
            Your school's pulse, delivered daily
          </h2>
          <p className="text-text-secondary text-base leading-relaxed">
            Attendance tracking, daily principal reports, and analytics — all automated. Get your 4 PM WhatsApp summary and know everything that happened today.
          </p>
        </div>

        {/* Daily Report Mockup + Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Daily Report */}
          <div className="reveal-left">
            <h3 className="font-display text-xl font-700 text-text-primary mb-2">Daily Principal Report</h3>
            <p className="text-text-secondary text-sm mb-6">Delivered to your WhatsApp every day at 4:00 PM</p>

            {/* WhatsApp Report Mockup */}
            <div className="bg-[#ECE5DD] rounded-2xl p-5 border border-[#D1C4B0] shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#D1C4B0]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs font-700">RS</span>
                </div>
                <div>
                  <p className="text-xs font-700 text-[#1a1a1a]">Relayra School</p>
                  <p className="text-[10px] text-[#667781]">Daily Report · 4:00 PM</p>
                </div>
              </div>

              <div className="bg-white rounded-xl rounded-tl-sm p-4 shadow-sm">
                <p className="text-xs font-800 text-[#1a1a1a] mb-3">📊 Daily Summary — 31 Mar 2026</p>
                <div className="space-y-3">
                  {reportItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${item.color}15` }}
                      >
                        <Icon name={item.icon as 'UserGroupIcon'} size={14} variant="outline" style={{ color: item.color } as React.CSSProperties} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-[#667781] font-500">{item.label}</span>
                          <span className="text-xs font-800 text-[#1a1a1a]">{item.value}</span>
                        </div>
                        <p className="text-[9px] text-[#667781] mt-0.5">{item.trend}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#f1f1f1] flex items-center justify-between">
                  <span className="text-[10px] text-[#667781]">📅 Tomorrow: Parent-Teacher Meeting, Class 8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance tracking */}
          <div className="reveal-right">
            <h3 className="font-display text-xl font-700 text-text-primary mb-2">Attendance Tracking</h3>
            <p className="text-text-secondary text-sm mb-6">Multiple input methods, automatic absence alerts</p>

            {/* Input methods */}
            <div className="space-y-3 mb-6">
              {attendanceMethods.map((method) => (
                <div key={method.title} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 hover:border-accent/30 hover:shadow-card transition-all">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={method.icon as 'PencilSquareIcon'} size={20} variant="outline" className="text-accent-dark" />
                  </div>
                  <div>
                    <p className="font-display font-700 text-text-primary text-sm">{method.title}</p>
                    <p className="text-text-secondary text-xs">{method.desc}</p>
                  </div>
                  <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* Absence alert example */}
            <div className="bg-white rounded-xl border border-border p-5">
              <h4 className="font-display font-700 text-text-primary text-sm mb-3 flex items-center gap-2">
                <Icon name="BellAlertIcon" size={16} variant="outline" className="text-danger" />
                Consecutive Absence Alert
              </h4>
              <div className="bg-[#ECE5DD] rounded-xl p-4">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                  <p className="text-xs text-[#1a1a1a] leading-relaxed">
                    ⚠️ <strong>Absence Alert</strong><br />
                    <strong>Riya Sharma (Class 6-A)</strong> has been absent for <strong>3 consecutive days</strong> (28, 29, 31 Mar). Please contact parents.<br /><br />
                    Parent: <strong>Mrs. Anjali Sharma</strong> · +91 98765 XXXXX
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard preview */}
        <div className="bg-white rounded-2xl border border-border p-8 reveal delay-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-display text-xl font-700 text-text-primary">Analytics Dashboard</h3>
              <p className="text-text-secondary text-sm mt-1">Real-time insights for school administrators</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-success/10 text-success text-xs font-700 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot"></span>
              Live Data
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Collection Rate', value: '91.4%', change: '+4.2%', color: '#0D9488' },
              { label: 'Avg. Response Time', value: '4.2s', change: 'AI replies', color: '#1E3A5F' },
              { label: 'Monthly Revenue', value: 'Rs. 18.4L', change: '+23% MoM', color: '#F59E0B' },
              { label: 'Attendance Rate', value: '92.9%', change: '+1.3% WoW', color: '#10B981' },
            ].map((metric) => (
              <div key={metric.label} className="bg-bg-base rounded-xl p-4 border border-border">
                <p className="text-text-secondary text-xs mb-2">{metric.label}</p>
                <p className="font-display font-800 text-xl text-text-primary mb-1">{metric.value}</p>
                <p className="text-xs font-600" style={{ color: metric.color }}>{metric.change}</p>
                {/* Mini bar */}
                <div className="mt-3 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: metric.value.includes('%') ? metric.value : '65%',
                      background: metric.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}