import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API Route: POST /api/nominate
 * 
 * Sends nomination data to Slack via webhook
 */

interface NominationPayload {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone?: string;
  businessName: string;
  businessWebsite?: string;
  businessWebsiteOrInstagram?: string;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Check for Slack webhook URL
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  
  if (!SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL is not configured');
    return res.status(500).json({ 
      success: false, 
      error: 'Slack not configured' 
    });
  }

  // Parse and validate body
  const body = req.body;
  
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  // Validate required fields
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
    errors.push('Reason is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Sanitize data
  const data: NominationPayload = {
    nominatorName: sanitize(body.nominatorName),
    nominatorEmail: sanitize(body.nominatorEmail).toLowerCase(),
    nominatorPhone: sanitize(body.nominatorPhone),
    businessName: sanitize(body.businessName),
    businessWebsiteOrInstagram: sanitize(body.businessWebsite || body.businessWebsiteOrInstagram),
    reason: sanitize(body.reason),
    notifyBusiness: Boolean(body.notifyBusiness),
    businessContact: sanitize(body.businessContact),
  };

  // Build Slack message
  const slackMessage = {
    text: "New What's the 661 nomination",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: 
            `*New What's the 661 nomination*\n` +
            `*Nominator:* ${data.nominatorName} (${data.nominatorEmail}${data.nominatorPhone ? `, ${data.nominatorPhone}` : ''})\n` +
            `*Business:* ${data.businessName}${data.businessWebsiteOrInstagram ? ` (${data.businessWebsiteOrInstagram})` : ''}\n` +
            `*Notify business?:* ${data.notifyBusiness ? 'Yes' : 'No'}\n` +
            `${data.businessContact ? `*Business contact:* ${data.businessContact}\n` : ''}` +
            `*Reason:*\n${data.reason}`
        }
      }
    ]
  };

  // Send to Slack
  try {
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error('Slack webhook error:', slackResponse.status, errorText);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send nomination' 
      });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error sending to Slack:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send nomination' 
    });
  }
}
