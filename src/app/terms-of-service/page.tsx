import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 sm:p-12">
            <h1 className="font-display text-3xl font-800 text-[#1E3A5F] mb-2">Terms of Service</h1>
            <p className="text-[#94A3B8] text-sm mb-8">Last updated: April 2026</p>

            <div className="prose prose-sm max-w-none text-[#475569] space-y-6">
              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">1. Acceptance of Terms</h2>
                <p>By accessing or using the Relayra platform (&ldquo;Service&rdquo;) operated by Relayra Solutions (&ldquo;Company&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">2. Description of Service</h2>
                <p>Relayra is a managed school operations platform that provides:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Automated fee reminder and collection via WhatsApp</li>
                  <li>Parent communication management</li>
                  <li>Attendance tracking and reporting</li>
                  <li>School analytics and dashboard</li>
                  <li>AI-powered message generation</li>
                </ul>
                <p>The Service is provided as a managed SaaS platform. We handle setup, configuration, and ongoing operations on behalf of subscribing schools.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">3. User Accounts</h2>
                <p>Accounts are created by school administrators or by Relayra on behalf of the school. You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately of any unauthorized use of your account.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">4. School Responsibilities</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Providing accurate and up-to-date student and parent contact information</li>
                  <li>Obtaining necessary consent from parents/guardians for WhatsApp communications</li>
                  <li>Ensuring fee structures and amounts entered are accurate</li>
                  <li>Complying with applicable Indian laws regarding student data and communications</li>
                  <li>Not using the platform for spam, harassment, or any unlawful purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">5. Payment Terms</h2>
                <p>Subscription fees are billed monthly as per the selected plan. All prices are in Indian Rupees (Rs.) and exclusive of applicable taxes (GST). Payment is due at the beginning of each billing cycle. Non-payment may result in service suspension after a 7-day grace period.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">6. Service Availability</h2>
                <p>We aim to maintain 99.9% uptime for the platform. However, we do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance. WhatsApp message delivery depends on Meta&apos;s infrastructure and the recipient&apos;s phone/network status.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">7. Data Ownership</h2>
                <p>All school data (student records, fee records, attendance data) remains the property of the subscribing school. Relayra acts as a data processor on behalf of the school. Upon termination, schools may request an export of all their data.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">8. Limitation of Liability</h2>
                <p>Relayra Solutions shall not be liable for:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Delays or failures in WhatsApp message delivery caused by Meta or network issues</li>
                  <li>Inaccurate data entered by the school or its staff</li>
                  <li>Payment processing failures by third-party payment providers</li>
                  <li>Any indirect, incidental, or consequential damages</li>
                </ul>
                <p>Our total liability shall not exceed the fees paid by the school in the preceding 3 months.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">9. Termination</h2>
                <p>Either party may terminate the service with 30 days written notice. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, access to the platform will be revoked and data will be retained for 90 days before deletion.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">10. Governing Law</h2>
                <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Moradabad, Uttar Pradesh.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">11. Changes to Terms</h2>
                <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms. Material changes will be communicated via email to registered school administrators.</p>
              </section>

              <section>
                <h2 className="font-display text-lg font-700 text-[#1E293B]">12. Contact</h2>
                <p>For questions about these Terms, contact us at:<br />Relayra Solutions<br />Email: <a href="mailto:hello@relayrasolutions.com" className="text-[#0D9488] hover:underline">hello@relayrasolutions.com</a></p>
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
