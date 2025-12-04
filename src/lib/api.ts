import { NominationPayload } from '@/types/nomination';

/**
 * Submit a nomination to the backend.
 * 
 * TODO: Hook this up to backend endpoint that:
 * - Emails the show runner with nomination details
 * - Pushes data into Google Sheets / database
 * - Sends confirmation email to nominator
 * - Optionally notifies the business if requested
 * 
 * Expected endpoint: POST /api/nominate
 */
export async function submitNomination(data: NominationPayload): Promise<{ success: boolean; message: string }> {
  // Simulate API call with delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/nominate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // return response.json();

  console.log('Nomination submitted:', data);
  
  return {
    success: true,
    message: 'Nomination received successfully',
  };
}
