import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-12">
            <div className="text-5xl mb-6">📝</div>
            <h1 className="font-display text-3xl font-800 text-[#1E3A5F] mb-4">
              Blog Coming Soon
            </h1>
            <p className="text-[#64748B] text-lg mb-8 max-w-md mx-auto">
              We&apos;re working on helpful content about school operations, fee management, and parent communication best practices. Follow us for updates.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:hello@relayrasolutions.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0D9488] text-white rounded-lg font-semibold text-sm hover:bg-[#0B7A70] transition-colors"
              >
                Get Notified
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 text-[#64748B] hover:text-[#1E293B] text-sm font-medium transition-colors"
              >
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
