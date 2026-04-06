'use client';
import React, { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  {
    value: '98%',
    label: 'WhatsApp Delivery Rate',
    description: 'Messages reach parents instantly',
  },
  {
    value: '3-Level',
    label: 'Smart Escalation',
    description: 'Automated fee reminders that actually work',
  },
  {
    value: '<48 Hours',
    label: 'Quick Setup',
    description: 'Go live with your school data in under 2 days',
  },
  {
    value: '0',
    label: 'Manual Follow-ups',
    description: 'Fully automated parent communication',
  },
];

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-white border-y border-border py-2">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center px-4 py-8 transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="font-display font-800 text-3xl sm:text-4xl text-[#1E3A5F] mb-1">
                <span className="text-teal">{stat.value}</span>
              </div>
              <div className="font-display font-700 text-text-primary text-sm mb-1">{stat.label}</div>
              <div className="text-text-secondary text-xs max-w-[160px] leading-relaxed">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
