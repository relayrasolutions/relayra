import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const footerLinks = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'How It Works', href: '/homepage#how-it-works' },
  ],
  Resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Case Studies', href: '/blog?category=case-studies' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      {/* Top CTA Banner */}
      <div className="guarantee-banner mx-4 sm:mx-6 lg:mx-8 mt-0 mb-0 rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="section-label text-teal-light mb-2">Get Started Today</p>
          <h3 className="font-display text-2xl md:text-3xl font-700 text-white leading-tight">
            Ready to recover your school's fees?
          </h3>
          <p className="text-white/70 mt-2 text-sm max-w-md">
            Join 500+ schools already using Relayra to automate fee collection and parent communication.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <a
            href="https://wa.me/91XXXXXXXXXX?text=Hi%2C+I%27d+like+to+book+a+demo+for+Relayra+Solutions"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-orange inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-display whitespace-nowrap"
          >
            <Icon name="CalendarIcon" size={16} variant="outline" />
            Book a Free Demo
          </a>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white border border-white/25 rounded-btn hover:border-white/60 hover:bg-white/5 transition-all whitespace-nowrap"
          >
            View Pricing
          </Link>
        </div>
      </div>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <AppLogo size={36} />
              <span className="font-display font-700 text-lg text-white">Relayra</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Revenue Recovery & Communication Intelligence Platform for Indian schools.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-success pulse-dot"></span>
              <span className="text-xs text-white/50">All systems operational</span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks)?.map(([group, links]) => (
            <div key={group} className="col-span-1">
              <p className="text-xs font-700 uppercase tracking-wider text-white/40 mb-4">{group}</p>
              <ul className="space-y-3">
                {links?.map((link) => (
                  <li key={link?.label}>
                    <Link
                      href={link?.href}
                      className="text-sm text-white/65 hover:text-white transition-colors duration-200"
                    >
                      {link?.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs font-700 uppercase tracking-wider text-white/40 mb-4">Contact</p>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@relayrasolutions.com"
                  className="text-sm text-white/65 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Icon name="EnvelopeIcon" size={14} variant="outline" className="flex-shrink-0" />
                  hello@relayrasolutions.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/91XXXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/65 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={14} variant="outline" className="flex-shrink-0" />
                  WhatsApp Chat
                </a>
              </li>
            </ul>
            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              {['LinkedIn', 'Twitter', 'Facebook']?.map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
                >
                  <Icon name="LinkIcon" size={12} variant="outline" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © 2026 Relayra Solutions. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Made with ♥ for Indian schools
          </p>
        </div>
      </div>
    </footer>
  );
}