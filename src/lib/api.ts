import { NominationPayload } from '@/types/nomination';

/**
 * Creates a mailto link with all nomination details pre-filled
 * and opens the user's default email client
 * 
 * Uses anchor click method for better iOS compatibility
 */
export function submitNomination(data: NominationPayload): Promise<{ success: boolean; error?: string; mailtoLink?: string }> {
  return new Promise((resolve) => {
    try {
      const to = 'contact@whatsthe661.com';
      const subject = encodeURIComponent(`What's the 661 Nomination: ${data.businessName}`);
      
      // Simplified body for better mobile compatibility
      const bodyLines = [
        `NOMINATION FOR WHAT'S THE 661`,
        ``,
        `Business: ${data.businessName}`,
        data.businessWebsite ? `Website/Instagram: ${data.businessWebsite}` : '',
        ``,
        `Why featured:`,
        data.reason,
        ``,
        `Nominated by: ${data.nominatorName}`,
        `Email: ${data.nominatorEmail}`,
        data.nominatorPhone ? `Phone: ${data.nominatorPhone}` : '',
        ``,
        data.notifyBusiness ? `Notify business: Yes` : '',
        data.notifyBusiness && data.businessContact ? `Business contact: ${data.businessContact}` : '',
      ].filter(line => line !== '').join('\n');

      const body = encodeURIComponent(bodyLines);
      const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
      
      // Create a temporary anchor element and click it
      // This method works better on iOS Safari
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.setAttribute('target', '_self');
      document.body.appendChild(link);
      
      // Trigger click
      link.click();
      
      // Cleanup
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, 100);
      
      // Return success with the mailto link as fallback
      resolve({ success: true, mailtoLink });
      
    } catch (error) {
      console.error('Error creating mailto link:', error);
      resolve({ success: false, error: 'Unable to open email client.' });
    }
  });
}
