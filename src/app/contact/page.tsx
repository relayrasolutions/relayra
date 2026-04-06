'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage contact form section
    router.replace('/#contact');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <p className="text-[#64748B] text-sm">Redirecting to contact form...</p>
    </div>
  );
}
