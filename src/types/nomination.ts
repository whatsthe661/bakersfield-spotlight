/**
 * Nomination data model
 * This interface is shared between client and server (Vercel serverless function)
 */
export interface NominationPayload {
  /** Name of the person submitting the nomination */
  nominatorName: string;
  /** Email of the nominator (required for confirmation) */
  nominatorEmail: string;
  /** Phone number of the nominator (optional) */
  nominatorPhone: string;
  /** Name of the business being nominated */
  businessName: string;
  /** Business website or Instagram handle (optional) */
  businessWebsite: string;
  /** Reason why this business should be featured */
  reason: string;
  /** Whether to notify the business about the nomination */
  notifyBusiness: boolean;
  /** Contact info for the business (email or phone, optional) */
  businessContact: string;
}

/**
 * Server-side nomination data (includes metadata)
 */
export interface NominationRecord extends NominationPayload {
  /** ISO timestamp when the nomination was created (set server-side) */
  createdAt: string;
  /** Unique ID for tracking (optional, set server-side) */
  id?: string;
}

/**
 * API response for nomination submission
 */
export interface NominationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export type FormStep = 1 | 2 | 3 | 4;

export const FORM_STEPS: { step: FormStep; title: string; fields: (keyof NominationPayload)[] }[] = [
  { step: 1, title: 'Your Info', fields: ['nominatorName', 'nominatorEmail', 'nominatorPhone'] },
  { step: 2, title: 'Business Info', fields: ['businessName', 'businessWebsite'] },
  { step: 3, title: 'Your Story', fields: ['reason'] },
  { step: 4, title: 'Final Step', fields: ['notifyBusiness', 'businessContact'] },
];

export const initialFormData: NominationPayload = {
  nominatorName: '',
  nominatorEmail: '',
  nominatorPhone: '',
  businessName: '',
  businessWebsite: '',
  reason: '',
  notifyBusiness: false,
  businessContact: '',
};
