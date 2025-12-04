export interface NominationPayload {
  nominatorName: string;
  nominatorEmail: string;
  nominatorPhone: string;
  businessName: string;
  businessWebsite: string;
  reason: string;
  notifyBusiness: boolean;
  businessContact: string;
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
