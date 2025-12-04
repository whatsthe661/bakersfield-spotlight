/**
 * Email Utility Module
 * 
 * Handles sending nomination emails using Resend SDK.
 * All configuration is read from environment variables.
 */

import { Resend } from 'resend';

// ============================================================================
// Types
// ============================================================================

interface NominationRecord {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone?: string;
  businessName: string;
  businessWebsite?: string;
  reason: string;
  notifyBusiness: boolean;
  businessContact?: string;
  createdAt: string;
}

interface NominationEmailResult {
  showRunnerEmailSent: boolean;
  nominatorEmailSent: boolean;
  error?: string;
}

// ============================================================================
// Environment Validation
// ============================================================================

function getEnvConfig(): { apiKey: string; emailFrom: string; emailTo: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const emailTo = process.env.EMAIL_TO_SHOW_RUNNER;

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return null;
  }
  if (!emailFrom) {
    console.error('EMAIL_FROM is not configured');
    return null;
  }
  if (!emailTo) {
    console.error('EMAIL_TO_SHOW_RUNNER is not configured');
    return null;
  }

  return { apiKey, emailFrom, emailTo };
}

// ============================================================================
// Email Templates
// ============================================================================

function createShowRunnerEmail(nomination: NominationRecord): { subject: string; text: string; html: string } {
  const subject = `New What's the 661 Nomination: ${nomination.businessName}`;
  
  const text = `
New Nomination Received!

Business: ${nomination.businessName}
${nomination.businessWebsite ? `Website/Instagram: ${nomination.businessWebsite}` : ''}

Why they should be featured:
${nomination.reason}

---

Nominated by:
Name: ${nomination.nominatorName}
Email: ${nomination.nominatorEmail}
${nomination.nominatorPhone ? `Phone: ${nomination.nominatorPhone}` : ''}

${nomination.notifyBusiness ? `Wants us to notify the business: Yes${nomination.businessContact ? `\nBusiness contact: ${nomination.businessContact}` : ''}` : 'Wants us to notify the business: No'}

---
Submitted: ${new Date(nomination.createdAt).toLocaleString('en-US', { 
  timeZone: 'America/Los_Angeles',
  dateStyle: 'full',
  timeStyle: 'short'
})}
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #d4a24c 0%, #b8860b 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; color: #1a1a1a; font-size: 24px;">New Nomination</h1>
    <p style="margin: 8px 0 0; color: #1a1a1a; opacity: 0.8;">What's the 661</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 24px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px;">${escapeHtml(nomination.businessName)}</h2>
    ${nomination.businessWebsite ? `<p style="margin: 0 0 16px; color: #666;"><strong>Website/Instagram:</strong> ${escapeHtml(nomination.businessWebsite)}</p>` : ''}
    
    <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h3 style="margin: 0 0 8px; color: #666; font-size: 14px; text-transform: uppercase;">Why They Should Be Featured</h3>
      <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(nomination.reason)}</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <h3 style="margin: 0 0 12px; color: #1a1a1a; font-size: 16px;">Nominated By</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 4px 0; color: #666;">Name:</td><td style="padding: 4px 0;">${escapeHtml(nomination.nominatorName)}</td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Email:</td><td style="padding: 4px 0;"><a href="mailto:${escapeHtml(nomination.nominatorEmail)}">${escapeHtml(nomination.nominatorEmail)}</a></td></tr>
      ${nomination.nominatorPhone ? `<tr><td style="padding: 4px 0; color: #666;">Phone:</td><td style="padding: 4px 0;">${escapeHtml(nomination.nominatorPhone)}</td></tr>` : ''}
    </table>
    
    <div style="margin-top: 16px; padding: 12px; background: ${nomination.notifyBusiness ? '#e8f5e9' : '#fafafa'}; border-radius: 6px;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Notify business:</strong> ${nomination.notifyBusiness ? 'Yes' : 'No'}
        ${nomination.notifyBusiness && nomination.businessContact ? `<br><strong>Business contact:</strong> ${escapeHtml(nomination.businessContact)}` : ''}
      </p>
    </div>
    
    <p style="margin: 24px 0 0; color: #999; font-size: 12px;">
      Submitted: ${new Date(nomination.createdAt).toLocaleString('en-US', { 
        timeZone: 'America/Los_Angeles',
        dateStyle: 'full',
        timeStyle: 'short'
      })}
    </p>
  </div>
  
  <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
    <p style="margin: 0;">This email was sent from whatsthe661.com</p>
  </div>
</body>
</html>
  `.trim();
  
  return { subject, text, html };
}

function createNominatorConfirmationEmail(nomination: NominationRecord): { subject: string; text: string; html: string } {
  const subject = `Thanks for your nomination – What's the 661`;
  
  const text = `
Hi ${nomination.nominatorName},

Thank you for nominating ${nomination.businessName} to be featured on "What's the 661"!

We've received your nomination and our team will review it. If this business is selected for the series, we'll reach out with next steps.

---

Your nomination:
Business: ${nomination.businessName}
${nomination.businessWebsite ? `Website/Instagram: ${nomination.businessWebsite}` : ''}

Why you think they should be featured:
${nomination.reason}

---

Have questions? Reply to this email or reach us at contact@whatsthe661.com

Follow the journey:
Instagram: @whatsthe661
TikTok: @whatsthe661

– The What's the 661 Team

Built in Bakersfield.
  `.trim();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
  <div style="background: #1a1a1a; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #d4a24c; font-size: 28px; letter-spacing: 2px;">WHAT'S THE 661</h1>
    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.6); font-size: 14px; letter-spacing: 3px;">BUILT IN BAKERSFIELD</p>
  </div>
  
  <div style="background: white; padding: 32px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px;">Thank you, ${escapeHtml(nomination.nominatorName)}!</h2>
    
    <p style="margin: 0 0 24px;">We've received your nomination for <strong>${escapeHtml(nomination.businessName)}</strong> to be featured on our docu-series.</p>
    
    <p style="margin: 0 0 24px;">Our team will review your submission. If this business is selected, we'll reach out with next steps.</p>
    
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Nomination</h3>
      <p style="margin: 0 0 8px;"><strong>${escapeHtml(nomination.businessName)}</strong></p>
      ${nomination.businessWebsite ? `<p style="margin: 0 0 8px; color: #666; font-size: 14px;">${escapeHtml(nomination.businessWebsite)}</p>` : ''}
      <p style="margin: 16px 0 0; font-size: 14px; font-style: italic; color: #555;">"${escapeHtml(nomination.reason.slice(0, 200))}${nomination.reason.length > 200 ? '...' : ''}"</p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    
    <p style="margin: 0 0 16px; font-size: 14px; color: #666;">Follow the journey:</p>
    
    <div style="text-align: center; margin: 16px 0;">
      <a href="https://instagram.com/whatsthe661" style="display: inline-block; margin: 0 8px; padding: 10px 20px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">Instagram</a>
      <a href="https://tiktok.com/@whatsthe661" style="display: inline-block; margin: 0 8px; padding: 10px 20px; background: #1a1a1a; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">TikTok</a>
    </div>
  </div>
  
  <div style="padding: 24px; text-align: center; color: #999; font-size: 12px;">
    <p style="margin: 0 0 8px;">Questions? Reach us at <a href="mailto:contact@whatsthe661.com" style="color: #d4a24c;">contact@whatsthe661.com</a></p>
    <p style="margin: 0;">© ${new Date().getFullYear()} Vetra. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
  
  return { subject, text, html };
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Send nomination notification emails using Resend SDK
 * 
 * @param nomination - The nomination record with all details
 * @returns Object indicating which emails were sent successfully
 */
export async function sendNominationEmails(nomination: NominationRecord): Promise<NominationEmailResult> {
  const config = getEnvConfig();
  
  if (!config) {
    return {
      showRunnerEmailSent: false,
      nominatorEmailSent: false,
      error: 'Email configuration is missing.',
    };
  }

  const resend = new Resend(config.apiKey);
  
  const result: NominationEmailResult = {
    showRunnerEmailSent: false,
    nominatorEmailSent: false,
  };
  
  // Send email to show runner (critical - goes to whatsthe661@gmail.com)
  try {
    const showRunnerEmail = createShowRunnerEmail(nomination);
    const { error } = await resend.emails.send({
      from: config.emailFrom,
      to: config.emailTo,
      subject: showRunnerEmail.subject,
      text: showRunnerEmail.text,
      html: showRunnerEmail.html,
    });
    
    if (error) {
      console.error('Failed to send show runner email:', error);
    } else {
      result.showRunnerEmailSent = true;
    }
  } catch (err) {
    console.error('Error sending show runner email:', err);
  }
  
  // Send confirmation to nominator (non-critical)
  try {
    const nominatorEmail = createNominatorConfirmationEmail(nomination);
    const { error } = await resend.emails.send({
      from: config.emailFrom,
      to: nomination.nominatorEmail,
      subject: nominatorEmail.subject,
      text: nominatorEmail.text,
      html: nominatorEmail.html,
    });
    
    if (error) {
      console.error('Failed to send nominator confirmation email:', error);
    } else {
      result.nominatorEmailSent = true;
    }
  } catch (err) {
    console.error('Error sending nominator confirmation email:', err);
  }
  
  return result;
}
