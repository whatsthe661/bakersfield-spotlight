import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendNominationEmails } from './_lib/email';

/**
 * API Route: POST /api/nominate
 * 
 * Handles nomination form submissions:
 * 1. Validates required fields
 * 2. Sanitizes input data
 * 3. Sends notification email to show runner (whatsthe661@gmail.com)
 * 4. Sends confirmation email to nominator
 * 5. Returns success/error response
 */

interface NominationPayload {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone?: string;
  businessName: string;
  businessWebsite?: string;
  businessWebsiteOrInstagram?: string; // Alternative field name
  reason: string;
  notifyBusiness?: boolean;
  businessContact?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(value: string | undefined): string {
  if (!value) return '';
  return value.trim().slice(0, 5000); // Limit length for safety
}

function validatePayload(body: unknown): { valid: true; data: NominationPayload } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }
  
  const data = body as Record<string, unknown>;
  
  // Required fields
  if (!data.nominatorName || typeof data.nominatorName !== 'string' || !data.nominatorName.trim()) {
    errors.push({ field: 'nominatorName', message: 'Name is required' });
  }
  
  if (!data.nominatorEmail || typeof data.nominatorEmail !== 'string' || !data.nominatorEmail.trim()) {
    errors.push({ field: 'nominatorEmail', message: 'Email is required' });
  } else if (!validateEmail(data.nominatorEmail as string)) {
    errors.push({ field: 'nominatorEmail', message: 'Please enter a valid email address' });
  }
  
  if (!data.businessName || typeof data.businessName !== 'string' || !data.businessName.trim()) {
    errors.push({ field: 'businessName', message: 'Business name is required' });
  }
  
  if (!data.reason || typeof data.reason !== 'string' || !data.reason.trim()) {
    errors.push({ field: 'reason', message: 'Please tell us why this business should be featured' });
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Accept either businessWebsite or businessWebsiteOrInstagram
  const website = data.businessWebsite || data.businessWebsiteOrInstagram;
  
  return {
    valid: true,
    data: {
      nominatorName: sanitize(data.nominatorName as string),
      nominatorEmail: sanitize(data.nominatorEmail as string).toLowerCase(),
      nominatorPhone: sanitize(data.nominatorPhone as string | undefined),
      businessName: sanitize(data.businessName as string),
      businessWebsite: sanitize(website as string | undefined),
      reason: sanitize(data.reason as string),
      notifyBusiness: Boolean(data.notifyBusiness),
      businessContact: sanitize(data.businessContact as string | undefined),
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  // Check environment variables
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;
  const EMAIL_TO_SHOW_RUNNER = process.env.EMAIL_TO_SHOW_RUNNER;
  
  if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO_SHOW_RUNNER) {
    console.error('Email configuration is missing. Check environment variables.');
    return res.status(500).json({ 
      success: false, 
      error: 'Email configuration is missing.' 
    });
  }
  
  // Validate payload
  const validation = validatePayload(req.body);
  
  if (!validation.valid) {
    const errorMessage = validation.errors.map(e => e.message).join(', ');
    return res.status(400).json({ success: false, error: errorMessage });
  }
  
  const { data } = validation;
  
  try {
    // Add server timestamp
    const nominationRecord = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    // Send emails
    const emailResult = await sendNominationEmails(nominationRecord);
    
    if (!emailResult.showRunnerEmailSent) {
      // Critical failure - show runner email didn't send
      console.error('Failed to send show runner notification email');
      return res.status(500).json({ 
        success: false, 
        error: 'Unable to process your nomination. Please try again later.' 
      });
    }
    
    if (!emailResult.nominatorEmailSent) {
      // Non-critical - log but still return success
      console.warn('Failed to send confirmation email to nominator:', data.nominatorEmail);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Nomination received successfully' 
    });
    
  } catch (error) {
    console.error('Unexpected error processing nomination:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}
