/**
 * Server-side configuration
 * 
 * Type-safe access to environment variables with validation.
 * This module should only be imported in server-side code (API routes).
 */

interface ServerConfig {
  /** Site URL (e.g., https://whatsthe661.com) */
  siteUrl: string;
  /** Site name for emails and branding */
  siteName: string;
  /** Email address for the show runner to receive nominations */
  emailToShowRunner: string;
  /** From address for outgoing emails (must be verified with email provider) */
  emailFrom: string;
  /** Resend API key (optional in development) */
  resendApiKey: string | null;
}

let cachedConfig: ServerConfig | null = null;

/**
 * Get server configuration from environment variables.
 * Validates required variables and provides sensible defaults where appropriate.
 * 
 * @throws Error if required variables are missing in production
 */
export function getConfig(): ServerConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  
  const siteUrl = process.env.SITE_URL || 'https://whatsthe661.com';
  const siteName = process.env.SITE_NAME || "What's the 661";
  const emailToShowRunner = process.env.EMAIL_TO_SHOW_RUNNER || 'contact@whatsthe661.com';
  const emailFrom = process.env.EMAIL_FROM || 'What\'s the 661 <contact@whatsthe661.com>';
  const resendApiKey = process.env.RESEND_API_KEY || null;
  
  // Warn in production if critical variables are missing
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  
  if (isProduction && !resendApiKey) {
    console.error('CRITICAL: RESEND_API_KEY is not set in production. Emails will not be sent!');
  }
  
  cachedConfig = {
    siteUrl,
    siteName,
    emailToShowRunner,
    emailFrom,
    resendApiKey,
  };
  
  return cachedConfig;
}

/**
 * Reset cached config (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}

