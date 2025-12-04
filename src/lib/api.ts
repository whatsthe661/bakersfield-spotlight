import { NominationPayload } from '@/types/nomination';

/**
 * Creates a mailto link with all nomination details pre-filled
 * and opens the user's default email client
 */
export function submitNomination(data: NominationPayload): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const to = 'contact@whatsthe661.com';
      const subject = encodeURIComponent(`What's the 661 Nomination: ${data.businessName}`);
      
      const body = encodeURIComponent(`
NEW NOMINATION FOR "WHAT'S THE 661"
====================================

BUSINESS INFORMATION
--------------------
Business Name: ${data.businessName}
Website/Instagram: ${data.businessWebsite || 'Not provided'}

WHY THEY SHOULD BE FEATURED
---------------------------
${data.reason}

NOMINATED BY
------------
Name: ${data.nominatorName}
Email: ${data.nominatorEmail}
Phone: ${data.nominatorPhone || 'Not provided'}

ADDITIONAL
----------
Notify the business: ${data.notifyBusiness ? 'Yes' : 'No'}
${data.notifyBusiness && data.businessContact ? `Business Contact: ${data.businessContact}` : ''}

====================================
Submitted via whatsthe661.com
      `.trim());

      // Open mailto link
      const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
      
      // Use a small delay to ensure state updates before navigation
      setTimeout(() => {
        window.location.href = mailtoLink;
      }, 100);
      
      // Return success immediately so UI updates
      resolve({ success: true });
      
    } catch (error) {
      console.error('Error creating mailto link:', error);
      resolve({ success: false, error: 'Unable to open email client.' });
    }
  });
}
