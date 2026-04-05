'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'navbar-scrolled bg-white/97 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <AppLogo
              size={36}
              className="group-hover:scale-105 transition-transform duration-300"
              onClick={() => {}}
            />
            <span className="font-display font-800 text-lg tracking-tight text-primary hidden sm:block">
              Relayra
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks?.map((link) => (
              <Link
                key={link?.href}
                href={link?.href}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors duration-200 rounded-btn hover:bg-primary/5"
              >
                {link?.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors duration-200 rounded-btn hover:bg-primary/5"
            >
              Login
            </Link>
            <a
              href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-orange inline-flex items-center gap-2 px-5 py-2.5 text-sm font-display"
            >
              <Icon name="CalendarIcon" size={16} variant="outline" />
              Book a Free Demo
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-btn text-text-primary hover:bg-primary/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <Icon name="XMarkIcon" size={24} variant="outline" />
            ) : (
              <Icon name="Bars3Icon" size={24} variant="outline" />
            )}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-16 bg-white/98 backdrop-blur-xl z-40 px-4 pt-6 pb-8 flex flex-col gap-2">
            {navLinks?.map((link) => (
              <Link
                key={link?.href}
                href={link?.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3.5 text-base font-medium text-text-primary hover:text-teal border-b border-border transition-colors"
              >
                {link?.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3.5 text-base font-medium text-teal hover:text-primary border-b border-border transition-colors"
            >
              Login →
            </Link>
            <div className="mt-6">
              <a
                href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-orange inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 text-base font-display"
              >
                <Icon name="CalendarIcon" size={18} variant="outline" />
                Book a Free Demo
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}