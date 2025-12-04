import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

/**
 * API Route: POST /api/nominate
 * 
 * Handles nomination form submissions
 */

interface NominationPayload {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone?: string;
  businessName: string;
  businessWebsite?: string;
  reason: string;
  notifyBusiness?: boolean;
  businessContact?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(value: string | undefined): string {
  if (!value) return '';
  return value.trim().slice(0, 5000);
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check environment variables
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const EMAIL_TO = process.env.EMAIL_TO_SHOW_RUNNER || 'whatsthe661@gmail.com';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ 
      success: false, 
      error: 'Email configuration is missing.' 
    });
  }

  // Parse and validate body
  const body = req.body;
  
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  const errors: string[] = [];
  
  if (!body.nominatorName || !String(body.nominatorName).trim()) {
    errors.push('Name is required');
  }
  if (!body.nominatorEmail || !String(body.nominatorEmail).trim()) {
    errors.push('Email is required');
  } else if (!validateEmail(String(body.nominatorEmail))) {
    errors.push('Please enter a valid email address');
  }
  if (!body.businessName || !String(body.businessName).trim()) {
    errors.push('Business name is required');
  }
  if (!body.reason || !String(body.reason).trim()) {
    errors.push('Please tell us why this business should be featured');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }

  // Sanitize data
  const data: NominationPayload = {
    nominatorName: sanitize(body.nominatorName),
    nominatorEmail: sanitize(body.nominatorEmail).toLowerCase(),
    nominatorPhone: sanitize(body.nominatorPhone),
    businessName: sanitize(body.businessName),
    businessWebsite: sanitize(body.businessWebsite || body.businessWebsiteOrInstagram),
    reason: sanitize(body.reason),
    notifyBusiness: Boolean(body.notifyBusiness),
    businessContact: sanitize(body.businessContact),
  };

  const createdAt = new Date().toISOString();

  try {
    const resend = new Resend(RESEND_API_KEY);

    // Send email to show runner
    const { error: showRunnerError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `New What's the 661 Nomination: ${data.businessName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d4a24c, #b8860b); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #1a1a1a;">New Nomination</h1>
            <p style="margin: 8px 0 0; color: #1a1a1a;">What's the 661</p>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0;">
            <h2 style="margin: 0 0 16px;">${escapeHtml(data.businessName)}</h2>
            ${data.businessWebsite ? `<p><strong>Website/Instagram:</strong> ${escapeHtml(data.businessWebsite)}</p>` : ''}
            <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px; color: #666;">Why They Should Be Featured</h3>
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.reason)}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            <h3>Nominated By</h3>
            <p><strong>Name:</strong> ${escapeHtml(data.nominatorName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.nominatorEmail)}">${escapeHtml(data.nominatorEmail)}</a></p>
            ${data.nominatorPhone ? `<p><strong>Phone:</strong> ${escapeHtml(data.nominatorPhone)}</p>` : ''}
            <p><strong>Notify business:</strong> ${data.notifyBusiness ? 'Yes' : 'No'}</p>
            ${data.notifyBusiness && data.businessContact ? `<p><strong>Business contact:</strong> ${escapeHtml(data.businessContact)}</p>` : ''}
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Submitted: ${new Date(createdAt).toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    if (showRunnerError) {
      console.error('Failed to send show runner email:', showRunnerError);
      return res.status(500).json({ 
        success: false, 
        error: 'Unable to process your nomination. Please try again later.' 
      });
    }

    // Send confirmation to nominator (non-critical)
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: data.nominatorEmail,
        subject: `Thanks for your nomination – What's the 661`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a1a; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #d4a24c;">WHAT'S THE 661</h1>
              <p style="color: rgba(255,255,255,0.6);">BUILT IN BAKERSFIELD</p>
            </div>
            <div style="background: white; padding: 32px; border: 1px solid #e0e0e0;">
              <h2>Thank you, ${escapeHtml(data.nominatorName)}!</h2>
              <p>We've received your nomination for <strong>${escapeHtml(data.businessName)}</strong> to be featured on our docu-series.</p>
              <p>Our team will review your submission. If this business is selected, we'll reach out with next steps.</p>
              <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #666; font-size: 12px;">YOUR NOMINATION</h3>
                <p style="margin: 0;"><strong>${escapeHtml(data.businessName)}</strong></p>
              </div>
              <p style="color: #666;">Questions? Reach us at <a href="mailto:contact@whatsthe661.com">contact@whatsthe661.com</a></p>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.warn('Failed to send confirmation email:', err);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Nomination received successfully' 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}
