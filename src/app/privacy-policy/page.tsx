import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 sm:p-12">
            <h1 className="font-display text-3xl font-800 text-[#1E3A5F] mb-2">Privacy Policy</h1>
            <p className="text-[#94A3B8] text-sm mb-8">Last updated: April 2026</p>

            <div className="prose prose-sm max-w-none text-[#475569] space-y-6">
              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">1. Introduction</h2>
                <p>Relayra Solutions (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the Relayra platform (relayra.vercel.app). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our services.</p>
                <p>Contact: <a href="mailto:hello@relayrasolutions.com" className="text-[#0D9488] hover:underline">hello@relayrasolutions.com</a></p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">2. Information We Collect</h2>
                <p><strong>School Data:</strong> School name, address, contact details, administrator information, staff details, and student records (names, class, parent/guardian contact information, fee records, attendance data).</p>
                <p><strong>Account Data:</strong> Email address, password (hashed), name, phone number, and role within the school.</p>
                <p><strong>Usage Data:</strong> Log data, device information, IP address, browser type, and pages visited.</p>
                <p><strong>Communication Data:</strong> Messages sent through the platform, including WhatsApp communications between schools and parents.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">3. How We Use Your Information</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To provide and maintain our school management services</li>
                  <li>To send automated fee reminders and school communications via WhatsApp</li>
                  <li>To generate attendance reports and analytics dashboards</li>
                  <li>To process fee payments and generate receipts</li>
                  <li>To improve our platform and develop new features</li>
                  <li>To communicate with school administrators about their account</li>
                  <li>To comply with legal obligations under Indian law</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">4. Data Storage and Security</h2>
                <p>Your data is stored on secure cloud infrastructure (Supabase/PostgreSQL). We implement industry-standard security measures including encryption in transit (TLS), row-level security policies, and role-based access controls.</p>
                <p>We do not sell, rent, or trade your personal information to third parties.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">5. Data Sharing</h2>
                <p>We may share data with:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>WhatsApp/Meta:</strong> To deliver messages to parents via the WhatsApp Business API</li>
                  <li><strong>Payment processors:</strong> To process fee payments (e.g., Razorpay, UPI providers)</li>
                  <li><strong>Cloud service providers:</strong> For hosting and infrastructure (Supabase, Vercel)</li>
                  <li><strong>Law enforcement:</strong> When required by applicable Indian law</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">6. Data Retention</h2>
                <p>We retain school and student data for as long as the school maintains an active account with us. Upon account termination, data will be deleted within 90 days unless retention is required by law.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">7. Your Rights</h2>
                <p>Under applicable Indian data protection laws, you have the right to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access and receive a copy of your data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
                <p>To exercise these rights, contact us at <a href="mailto:hello@relayrasolutions.com" className="text-[#0D9488] hover:underline">hello@relayrasolutions.com</a>.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">8. Children&apos;s Data</h2>
                <p>Our platform processes student data on behalf of schools. Schools are responsible for obtaining necessary parental consent for the collection and processing of student information. We do not directly collect data from children.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">9. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">10. Contact</h2>
                <p>Relayra Solutions<br />Moradabad, Uttar Pradesh, India<br />Email: <a href="mailto:hello@relayrasolutions.com" className="text-[#0D9488] hover:underline">hello@relayrasolutions.com</a></p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <Link href="/" className="text-[#0D9488] font-semibold text-sm hover:underline">
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
