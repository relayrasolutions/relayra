'use client';

import React, { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  phone: string;
  schoolName: string;
  studentCount: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  schoolName?: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    schoolName: '',
    studentCount: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Your name is required';
    if (!form.schoolName.trim()) newErrors.schoolName = 'School name is required';
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+\d\s\-()]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Request failed');
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmitError('');
    setForm({ name: '', email: '', phone: '', schoolName: '', studentCount: '', message: '' });
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
                We&apos;ll contact you within 24 hours to schedule your personalized demo.
              </p>
              <button
                onClick={resetForm}
                className="mt-6 text-[#0D9488] font-600 text-sm underline underline-offset-2 hover:text-[#0A7870] transition-colors"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Name + School Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                    Your Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Sharma"
                    className={`w-full px-4 py-3 rounded-lg border text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all ${
                      errors.name ? 'border-[#EF4444] bg-red-50' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.name}</p>}
                </div>

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
                  {errors.schoolName && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.schoolName}</p>}
                </div>
              </div>

              {/* Phone + Email row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  {errors.phone && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                    Email <span className="text-[#94A3B8] font-normal">(optional)</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="principal@school.edu.in"
                    className={`w-full px-4 py-3 rounded-lg border text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all ${
                      errors.email ? 'border-[#EF4444] bg-red-50' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.email}</p>}
                </div>
              </div>

              {/* Student Count */}
              <div>
                <label htmlFor="studentCount" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                  Approximate Student Count <span className="text-[#94A3B8] font-normal">(optional)</span>
                </label>
                <select
                  id="studentCount"
                  name="studentCount"
                  value={form.studentCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-[#1E293B] text-sm bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all"
                >
                  <option value="">Select range</option>
                  <option value="Under 200">Under 200</option>
                  <option value="200–500">200–500</option>
                  <option value="500–1000">500–1,000</option>
                  <option value="1000–2000">1,000–2,000</option>
                  <option value="2000+">2,000+</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-600 text-[#1E293B] mb-1.5">
                  Message <span className="text-[#94A3B8] font-normal">(optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your current challenges or what you'd like to see in the demo..."
                  className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] text-[#1E293B] text-sm placeholder-[#94A3B8] bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] transition-all resize-none"
                />
              </div>

              {/* Error banner */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

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
