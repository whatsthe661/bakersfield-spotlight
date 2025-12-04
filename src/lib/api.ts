import { NominationPayload, NominationResponse } from '@/types/nomination';

/**
 * Submit a nomination to the backend API.
 * 
 * This calls the Vercel serverless function at /api/nominate which:
 * - Validates the nomination data
 * - Sends an email to the show runner with nomination details
 * - Sends a confirmation email to the nominator
 * 
 * @param data - The nomination form data
 * @returns Promise with success status and optional error message
 */
export async function submitNomination(data: NominationPayload): Promise<NominationResponse> {
  try {
    const response = await fetch('/api/nominate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: NominationResponse = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Server error: ${response.status}`,
      };
    }

    return result;
  } catch (error) {
    console.error('Network error submitting nomination:', error);
    return {
      success: false,
      error: 'Unable to connect. Please check your internet connection and try again.',
    };
  }
}
