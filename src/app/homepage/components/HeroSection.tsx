'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

export default function HeroSection() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrollY = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrollY * 0.18}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-end overflow-hidden"
      aria-label="Hero section">
      
      {/* Background Image with Parallax */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 w-full h-[115%] -top-[7.5%] will-change-transform">
        
        <AppImage
          src="https://img.rocket.new/generatedImages/rocket_gen_img_12ec4476e-1767732823206.png"
          alt="Indian school classroom with students and teacher engaged in learning"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw" />
        
      </div>

      {/* Gradient Overlay */}
      <div className="hero-gradient absolute inset-0 z-10" />

      {/* Subtle noise */}
      <div
        className="absolute inset-0 z-10 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`
        }} />
      

      {/* Hero Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 lg:pb-24 pt-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal pulse-dot"></span>
            <span className="text-xs font-600 text-white/90 tracking-wide font-display">
              Managed WhatsApp Automation for Schools
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-800 text-white leading-[1.08] tracking-tight mb-6">
            Your School's Revenue Recovery &{' '}
            <span className="text-teal-light">Communication</span> Partner
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl mb-10 font-body">
            We don't give you software. We give you results. Fee collection,
            parent communication, attendance tracking — all automated via WhatsApp.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange inline-flex items-center gap-2.5 px-7 py-4 text-base font-display">
              
              <Icon name="CalendarIcon" size={18} variant="outline" />
              Book a Free Demo
            </a>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-white/85 hover:text-white text-sm font-medium transition-colors group">
              
              See how it works
              <Icon
                name="ArrowRightIcon"
                size={16}
                variant="outline"
                className="group-hover:translate-x-1 transition-transform" />
              
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-6 mt-10 pt-10 border-t border-white/15">
            {[
            { icon: 'ChatBubbleLeftRightIcon', text: 'WhatsApp-native messaging' },
            { icon: 'BoltIcon', text: 'Fully managed service' },
            { icon: 'ShieldCheckIcon', text: 'No technical setup required' }].
            map((item) =>
            <div key={item.text} className="flex items-center gap-2">
                <Icon name={item.icon as 'ShieldCheckIcon'} size={16} variant="outline" className="text-teal-light" />
                <span className="text-xs text-white/70 font-medium">{item.text}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-base to-transparent z-20" />
    </section>);

}