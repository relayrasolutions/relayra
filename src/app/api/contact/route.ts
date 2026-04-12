import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schoolName, principalEmail, phone, message } = body;

    if (!schoolName || !principalEmail || !phone || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Always log the lead
    console.log('=== NEW CONTACT FORM ===');
    console.log('School:', schoolName);
    console.log('Email:', principalEmail);
    console.log('Phone:', phone);
    console.log('Message:', message);
    console.log('========================');

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const { error } = await resend.emails.send({
        from: 'Relayra Solutions <noreply@relayrasolutions.com>',
        to: ['hello@relayrasolutions.com'],
        subject: `Contact Form: ${schoolName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1E293B;">
            <h2 style="color: #1E3A5F;">Contact Form Submission</h2>
            <p><strong>School:</strong> ${schoolName}</p>
            <p><strong>Email:</strong> ${principalEmail}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong> ${message}</p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
            <p style="font-size: 13px; color: #94A3B8;">Sent from relayrasolutions.com contact form</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API error:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
