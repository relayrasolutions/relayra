import React from 'react';
import Icon from '@/components/ui/AppIcon';

const parentMenuItems = [
  { number: '1', label: 'Fee balance & payment', icon: 'BanknotesIcon', color: '#0D9488' },
  { number: '2', label: 'Attendance record', icon: 'CalendarDaysIcon', color: '#1E3A5F' },
  { number: '3', label: 'Exam results', icon: 'AcademicCapIcon', color: '#F59E0B' },
  { number: '4', label: 'Syllabus download', icon: 'DocumentArrowDownIcon', color: '#10B981' },
  { number: '5', label: 'School calendar', icon: 'CalendarIcon', color: '#8B5CF6' },
  { number: '6', label: 'PTM schedule', icon: 'UserGroupIcon', color: '#EC4899' },
  { number: '7', label: 'Transport info', icon: 'TruckIcon', color: '#F97316' },
  { number: '8', label: 'Talk to admin', icon: 'ChatBubbleLeftIcon', color: '#64748B' },
];

const aiCapabilities = [
  { title: 'Hinglish AI Support', desc: 'Understands mixed Hindi-English messages naturally', icon: 'LanguageIcon' },
  { title: 'Under 5-Second Response', desc: 'Instant automated replies to common parent queries', icon: 'BoltIcon' },
  { title: 'Smart Escalation', desc: 'Complex queries automatically routed to school admin', icon: 'ArrowUpCircleIcon' },
  { title: 'Template Library', desc: '100+ pre-approved message templates for every occasion', icon: 'DocumentTextIcon' },
];

export default function CommunicationSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" aria-label="Smart communication features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-4 py-1.5 mb-4">
            <Icon name="ChatBubbleLeftRightIcon" size={14} variant="outline" className="text-primary" />
            <span className="text-xs font-700 text-primary uppercase tracking-wider">Smart Communication</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-text-primary tracking-tight mb-4">
            Your entire school in every parent's WhatsApp
          </h2>
          <p className="text-text-secondary text-base leading-relaxed">
            Parents can access everything they need — without calling the office. AI handles queries in Hindi, English, and Hinglish instantly.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Left: Parent Menu mockup */}
          <div className="reveal-left">
            <h3 className="font-display text-xl font-700 text-text-primary mb-6">
              Two-Way Parent Menu
            </h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Parents text the school's WhatsApp number and instantly access a self-service menu. No app downloads. No logins. Just WhatsApp.
            </p>

            {/* WhatsApp UI mockup */}
            <div className="bg-[#ECE5DD] rounded-2xl p-5 border border-[#D1C4B0] shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#D1C4B0]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs font-700">RS</span>
                </div>
                <div>
                  <p className="text-xs font-700 text-[#1a1a1a]">Delhi Valley School</p>
                  <p className="text-[10px] text-[#667781]">Relayra-powered · Verified Business</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="bg-white rounded-xl rounded-tl-sm p-3 shadow-sm max-w-[90%]">
                  <p className="text-xs text-[#1a1a1a] font-600 mb-2">
                    Welcome! How can I help you today? Reply with a number:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {parentMenuItems.map((item) => (
                      <button
                        key={item.number}
                        className="flex items-center gap-1.5 bg-bg-base rounded-lg px-2 py-1.5 text-left hover:bg-teal/5 transition-colors"
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-800 text-white flex-shrink-0"
                          style={{ background: item.color }}
                        >
                          {item.number}
                        </span>
                        <span className="text-[10px] text-[#1a1a1a] font-500 leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#D9FDD3] rounded-xl rounded-tr-sm p-2.5 max-w-[40%] ml-auto shadow-sm">
                  <p className="text-xs text-[#1a1a1a]">1</p>
                  <p className="text-[10px] text-[#667781] text-right mt-0.5">10:32 AM ✓✓</p>
                </div>

                <div className="bg-white rounded-xl rounded-tl-sm p-3 shadow-sm max-w-[90%]">
                  <p className="text-xs text-[#1a1a1a] font-600 mb-1">Fee Balance for Aryan (Class 7-B):</p>
                  <div className="bg-bg-base rounded-lg p-2 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-[#667781]">Q4 Tuition</span>
                      <span className="font-700 text-danger">Rs. 8,500 due</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#667781]">Annual Fee</span>
                      <span className="font-700 text-success">Paid ✓</span>
                    </div>
                  </div>
                  <div className="mt-2 bg-teal rounded-lg p-1.5 text-center">
                    <p className="text-white text-[10px] font-700">💳 Pay Rs. 8,500 Now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI capabilities */}
          <div className="reveal-right">
            <h3 className="font-display text-xl font-700 text-text-primary mb-6">
              AI-Powered Communication
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {aiCapabilities.map((cap) => (
                <div key={cap.title} className="bg-bg-base rounded-xl border border-border p-5 hover:border-primary/25 hover:shadow-card transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mb-3">
                    <Icon name={cap.icon as 'LanguageIcon'} size={20} variant="outline" className="text-primary" />
                  </div>
                  <h4 className="font-display font-700 text-text-primary text-sm mb-1">{cap.title}</h4>
                  <p className="text-text-secondary text-xs leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>

            {/* Festival greetings */}
            <div className="bg-bg-base rounded-xl border border-border p-5">
              <h4 className="font-display font-700 text-text-primary text-sm mb-3">
                Automated Festival & Birthday Greetings
              </h4>
              <p className="text-text-secondary text-xs mb-4 leading-relaxed">
                Birthday wishes sent at 9 AM on each student's birthday. Festival greetings for all major Indian celebrations:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Diwali', 'Holi', 'Eid', 'Christmas', 'Dussehra', 'Onam', 'Pongal', 'Baisakhi', 'Republic Day', 'Independence Day'].map((festival) => (
                  <span key={festival} className="text-xs bg-accent/10 text-accent-dark font-600 px-2.5 py-1 rounded-full">
                    {festival}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Broadcast feature */}
        <div className="bg-primary rounded-2xl p-8 reveal delay-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-4">
                <Icon name="MegaphoneIcon" size={14} variant="outline" className="text-teal-light" />
                <span className="text-xs font-700 text-white/80 uppercase tracking-wider">Emergency Broadcast</span>
              </div>
              <h3 className="font-display text-2xl font-800 text-white mb-3">
                Reach all parents in seconds
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                One-click broadcast to all parents, a specific class, or selected students. School closures, exam changes, emergency notices — delivered instantly.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-display font-800 text-3xl text-teal-light">1,200+</div>
                <div className="text-white/60 text-xs mt-1">parents notified</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-800 text-3xl text-accent">8 sec</div>
                <div className="text-white/60 text-xs mt-1">average delivery</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-800 text-3xl text-white">98%</div>
                <div className="text-white/60 text-xs mt-1">read rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}