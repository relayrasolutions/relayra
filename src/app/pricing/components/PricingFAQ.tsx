'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const faqs = [
  {
    question: 'Is there a setup fee or any hidden charges?',
    answer:
      'No setup fee, no per-message charges, no hidden costs. The monthly plan price is all-inclusive — WhatsApp integration, Razorpay setup, template creation, and ongoing support are all included.',
  },
  {
    question: 'How long does it take to get started?',
    answer:
      'Typically 3 working days from when you share your student data. Our team handles the entire configuration — WhatsApp Business API setup, fee schedules, escalation rules, and testing. You just share a spreadsheet.',
  },
  {
    question: 'What happens if parents don\'t have WhatsApp?',
    answer:
      'The Pro and Enterprise plans include multi-channel failsafe: if WhatsApp delivery fails, the message is automatically sent via SMS, then email. For Starter and Growth, WhatsApp delivery rates are 98%+ for Indian mobile numbers.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately (prorated billing). Downgrades take effect at the next billing cycle.',
  },
  {
    question: 'How does the 15% guarantee work exactly?',
    answer:
      'We measure your fee collection rate in the 30 days before going live with Relayra (your baseline). After 90 days, if the collection rate hasn\'t improved by at least 15 percentage points, we issue a full refund of all subscription fees paid. We track this transparently through the analytics dashboard.',
  },
  {
    question: 'Is student and parent data secure?',
    answer:
      'Yes. All data is encrypted in transit and at rest. We use WhatsApp Business API (Meta-verified), so all messages are end-to-end encrypted. We never share or sell school data. Every message includes the school\'s verified sender name so parents know it\'s authentic.',
  },
  {
    question: 'Do parents need to download an app?',
    answer:
      'No. Everything works through WhatsApp, which parents already have. There\'s no app to download, no login to create, no password to remember. Parents just text the school\'s WhatsApp number.',
  },
  {
    question: 'Can Relayra handle multiple fee types (tuition, transport, exam fees)?',
    answer:
      'Yes. You can configure any number of fee types, each with its own due date, amount, and escalation schedule. The system tracks each fee type separately and sends targeted reminders only for outstanding amounts.',
  },
];

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-bg-base" aria-label="Frequently asked questions">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 reveal">
          <p className="section-label mb-3">FAQ</p>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-text-primary tracking-tight mb-4">
            Questions schools ask us
          </h2>
          <p className="text-text-secondary text-base">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="space-y-3">
          {faqs?.map((faq, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl border transition-all duration-300 reveal ${index > 0 ? `delay-${Math.min(index * 50, 400)}` : ''} ${
                openIndex === index ? 'border-teal/30 shadow-card' : 'border-border'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="font-display font-700 text-text-primary text-sm leading-snug">
                  {faq?.question}
                </span>
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openIndex === index ? 'bg-teal text-white' : 'bg-bg-base text-text-secondary'
                  }`}
                >
                  <Icon
                    name={openIndex === index ? 'MinusIcon' : 'PlusIcon'}
                    size={14}
                    variant="outline"
                  />
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-5">
                  <div className="w-full h-px bg-border mb-4" />
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {faq?.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10 reveal delay-300">
          <p className="text-text-secondary text-sm mb-3">
            Still have questions? We're happy to help.
          </p>
          <a
            href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I+have+a+question+about+Relayra+pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-btn text-sm font-600 hover:bg-[#1ebe5d] transition-colors"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={16} variant="outline" />
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}