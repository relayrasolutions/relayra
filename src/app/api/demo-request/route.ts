import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, schoolName, studentCount, message } = body;

    // Validate required fields
    if (!name?.trim() || !phone?.trim() || !schoolName?.trim()) {
      return NextResponse.json(
        { error: 'Name, phone, and school name are required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Format phone with +91 prefix if not already present
    const formattedPhone = phone.trim().startsWith('+') ? phone.trim() : `+91 ${phone.trim()}`;

    // IST timestamp
    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // Log the lead (always, regardless of email delivery)
    console.log('=== NEW DEMO REQUEST ===');
    console.log('Name:', name);
    console.log('School:', schoolName);
    console.log('Phone:', formattedPhone);
    console.log('Email:', email || '(not provided)');
    console.log('Students:', studentCount || '(not provided)');
    console.log('Message:', message || '(none)');
    console.log('Time:', submittedAt);
    console.log('========================');

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn('RESEND_API_KEY not set — skipping email delivery');
      return NextResponse.json({ success: true });
    }

    const resend = new Resend(resendKey);

    // Send admin notification email
    const { error: adminError } = await resend.emails.send({
      from: 'Relayra Solutions <noreply@relayrasolutions.com>',
      to: ['hello@relayrasolutions.com'],
      subject: `New Demo Request: ${schoolName.trim()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1E293B;">
          <h2 style="color: #1E3A5F; margin-bottom: 24px;">New Demo Request</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; color: #64748B; width: 160px;">School Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${schoolName.trim()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; color: #64748B;">Contact Person</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${name.trim()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; color: #64748B;">Phone Number</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${formattedPhone}</td>
            </tr>
            ${email ? `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; color: #64748B;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${email.trim()}</td>
            </tr>` : ''}
            ${studentCount ? `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; color: #64748B;">Approx. Student Count</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; font-weight: 600;">${studentCount.trim()}</td>
            </tr>` : ''}
            ${message?.trim() ? `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0; color: #64748B;">Message</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">${message.trim()}</td>
            </tr>` : ''}
          </table>
          <p style="margin-top: 24px; font-size: 13px; color: #94A3B8;">Submitted at ${submittedAt} IST via relayrasolutions.com</p>
        </div>
      `,
    });

    if (adminError) {
      console.error('Resend admin email error:', adminError);
    }

    // Send confirmation email to submitter (only if email provided)
    if (email?.trim()) {
      const { error: confirmError } = await resend.emails.send({
        from: 'Relayra Solutions <noreply@relayrasolutions.com>',
        to: [email.trim()],
        subject: 'We received your demo request — Relayra Solutions',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1E293B;">
            <h2 style="color: #1E3A5F; margin-bottom: 8px;">Thank you for your interest!</h2>
            <p style="color: #64748B; line-height: 1.6;">
              We've received your demo request for <strong>${schoolName.trim()}</strong>. Our team will reach out to you within 24 hours to schedule a personalized walkthrough.
            </p>
            <p style="color: #64748B; line-height: 1.6;">
              If you have any urgent questions, feel free to reach us at
              <a href="mailto:hello@relayrasolutions.com" style="color: #0D9488;">hello@relayrasolutions.com</a>.
            </p>
            <p style="margin-top: 32px; color: #1E3A5F; font-weight: 600;">— Team Relayra</p>
          </div>
        `,
      });

      if (confirmError) {
        console.error('Resend confirmation email error:', confirmError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo request error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or call us directly.' },
      { status: 500 }
    );
  }
}
