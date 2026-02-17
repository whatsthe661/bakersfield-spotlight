import { NominationPayload, NominationResponse } from '@/types/nomination';

/**
 * Submit a nomination to the backend API
 * Sends data to Slack via webhook
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

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Something went wrong. Please try again.',
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Network error submitting nomination:', error);
    return {
      success: false,
      error: 'Unable to connect. Please check your internet connection and try again.',
    };
  }
}
