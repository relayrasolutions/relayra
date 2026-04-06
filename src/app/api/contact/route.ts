import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schoolName, principalEmail, phone, message } = body;

    if (!schoolName || !principalEmail || !phone || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Try Resend API if key is available
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Relayra Demo Request <onboarding@resend.dev>',
          to: ['hello@relayrasolutions.com'],
          subject: `Demo Request: ${schoolName}`,
          html: `
            <h2>New Demo Request</h2>
            <p><strong>School Name:</strong> ${schoolName}</p>
            <p><strong>Email:</strong> ${principalEmail}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong> ${message}</p>
            <hr>
            <p><em>Sent from relayra.vercel.app contact form</em></p>
          `,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Resend API error:', errorData);
        // Fall through to success anyway — we log the lead
      }
    }

    // Always log the lead to console for now
    console.log('=== NEW DEMO REQUEST ===');
    console.log('School:', schoolName);
    console.log('Email:', principalEmail);
    console.log('Phone:', phone);
    console.log('Message:', message);
    console.log('========================');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
