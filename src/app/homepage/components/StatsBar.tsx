'use client';
import React, { useEffect, useRef, useState } from 'react';

interface StatItem {
  prefix: string;
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const stats: StatItem[] = [
  {
    prefix: 'Rs.',
    value: 2.5,
    suffix: ' Cr+',
    label: 'Fees Recovered',
    description: 'Total fees recovered for schools',
  },
  {
    prefix: '',
    value: 500,
    suffix: '+',
    label: 'Schools Trust Us',
    description: 'Active schools on the platform',
  },
  {
    prefix: '',
    value: 98,
    suffix: '%',
    label: 'Message Delivery',
    description: 'WhatsApp delivery success rate',
  },
];

function useCountUp(target: number, duration: number, triggered: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!triggered) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(parseFloat(start.toFixed(1)));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, triggered]);
  return count;
}

function StatCounter({ stat, triggered }: { stat: StatItem; triggered: boolean }) {
  const count = useCountUp(stat.value, 1800, triggered);
  const displayValue = stat.value < 10 ? count.toFixed(1) : Math.floor(count).toString();

  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <div className="stat-number font-display mb-1">
        <span className="text-teal text-2xl font-700">{stat.prefix}</span>
        {displayValue}
        <span className="text-teal">{stat.suffix}</span>
      </div>
      <div className="font-display font-700 text-text-primary text-sm mb-1">{stat.label}</div>
      <div className="text-text-secondary text-xs max-w-[140px] leading-relaxed">{stat.description}</div>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTriggered(true);
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
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {stats.map((stat) => (
            <StatCounter key={stat.label} stat={stat} triggered={triggered} />
          ))}
        </div>
      </div>
    </section>
  );
}