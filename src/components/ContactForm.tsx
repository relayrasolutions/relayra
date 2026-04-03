'use client';

import React, { useState } from 'react';

interface FormState {
  schoolName: string;
  principalEmail: string;
  phone: string;
  message: string;
}

interface FormErrors {
  schoolName?: string;
  principalEmail?: string;
  phone?: string;
  message?: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    schoolName: '',
    principalEmail: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.schoolName.trim()) newErrors.schoolName = 'School name is required';
    if (!form.principalEmail.trim()) {
      newErrors.principalEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.principalEmail)) {
      newErrors.principalEmail = 'Enter a valid email address';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+\d\s\-()]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }
    if (!form.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 reveal">
          <span className="section-label mb-3 block">Get In Touch</span>
          <h2 className="font-display text-3xl sm:text-4xl font-800 text-[#1E3A5F] mb-4 leading-tight">
            Request a Free{' '}
            <span className="text-gradient-teal">Demo for Your School</span>
          </h2>
          <p className="text-[#64748B] text-lg max-w-xl mx-auto">
            Fill in your details and our team will reach out within 24 hours to schedule a personalised walkthrough.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_10px_40px_rgba(30,58,95,0.08)] p-8 sm:p-10 reveal delay-100">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#0D9488]/10 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-700 text-[#1E3A5F] mb-2">Thank You!</h3>
              <p className="text-[#64748B] text-base max-w-sm">
                We've received your inquiry. Our team will contact you within 24 hours to schedule your demo.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ schoolName: '', principalEmail: '', phone: '', message: '' }); }}
                className="mt-6 text-[#0D9488] font-600 text-sm underline underline-offset-2 hover:text-[#0A7870] transition-colors"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* School Name */}
              <div>
                <label htmlFor="schoolName" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                  School Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  value={form.schoolName}
                  onChange={handleChange}
                  placeholder="e.g. Delhi Public School, Sector 12"
                  className={`w-full px-4 py-3 rounded-lg border text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all ${
                    errors.schoolName ? 'border-[#EF4444] bg-red-50' : 'border-[#E2E8F0]'
                  }`}
                />
                {errors.schoolName && (
                  <p className="mt-1.5 text-xs text-[#EF4444]">{errors.schoolName}</p>
                )}
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="principalEmail" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                    Principal's Email <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="principalEmail"
                    name="principalEmail"
                    type="email"
                    value={form.principalEmail}
                    onChange={handleChange}
                    placeholder="principal@school.edu.in"
                    className={`w-full px-4 py-3 rounded-lg border text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all ${
                      errors.principalEmail ? 'border-[#EF4444] bg-red-50' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.principalEmail && (
                    <p className="mt-1.5 text-xs text-[#EF4444]">{errors.principalEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                    Phone Number <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-3 rounded-lg border text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all ${
                      errors.phone ? 'border-[#EF4444] bg-red-50' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-[#EF4444]">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                  Message <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your school — number of students, current challenges, or what you'd like to see in the demo..."
                  className={`w-full px-4 py-3 rounded-lg border text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all resize-none ${
                    errors.message ? 'border-[#EF4444] bg-red-50' : 'border-[#E2E8F0]'
                  }`}
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-[#EF4444]">{errors.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-orange px-6 py-3.5 text-base font-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    Request Free Demo
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-[#94A3B8]">
                No spam. No commitment. We'll only reach out to schedule your demo.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
