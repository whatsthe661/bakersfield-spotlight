import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { NominationPayload, FormStep, FORM_STEPS, initialFormData } from '@/types/nomination';
import { submitNomination } from '@/lib/api';
import { FormInput } from './FormInput';
import { SuccessState } from './SuccessState';

interface NominationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NominationForm({ isOpen, onClose }: NominationFormProps) {
  const [step, setStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<NominationPayload>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cloudkitError, setCloudkitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof NominationPayload, string>>>({});
  
  const prefersReducedMotion = useReducedMotion();

  const updateField = (field: keyof NominationPayload, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const validateStep = (): boolean => {
    const currentStep = FORM_STEPS.find(s => s.step === step);
    if (!currentStep) return true;

    const newErrors: Partial<Record<keyof NominationPayload, string>> = {};

    if (step === 1) {
      if (!formData.nominatorName.trim()) newErrors.nominatorName = 'Name is required';
      if (!formData.nominatorEmail.trim()) newErrors.nominatorEmail = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.nominatorEmail)) {
        newErrors.nominatorEmail = 'Please enter a valid email';
      }
    }

    if (step === 2) {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    }

    if (step === 3) {
      if (!formData.reason.trim()) newErrors.reason = 'Please tell us why this business should be featured';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep() && step < 4) {
      setStep((prev) => (prev + 1) as FormStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as FormStep);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await submitNomination(formData);
      if (result.success) {
        setCloudkitError(result.cloudkitOk === false ? (result.cloudkitError || 'CloudKit sync failed') : null);
        setIsSuccess(true);
      } else {
        setSubmitError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Unable to submit nomination. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setFormData(initialFormData);
      setIsSuccess(false);
      setIsSubmitting(false);
      setErrors({});
      setSubmitError(null);
      setCloudkitError(null);
    }, 300);
  };

  // Apple-like easing
  const easeOut = [0.16, 1, 0.3, 1];

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? 50 : -50),
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction < 0 ? 50 : -50),
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.92, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.92, y: prefersReducedMotion ? 0 : 20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: easeOut }}
          className="relative z-20 w-full max-w-md mx-auto px-4"
        >
          <motion.div
            className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl" style={{ '--foreground': '40 15% 88%', '--muted-foreground': '35 10% 50%' } as React.CSSProperties}
            initial={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            animate={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}
            transition={{ duration: 0.5 }}
          >
            {/* Close Button */}
            <motion.button
              onClick={handleClose}
              className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors p-2 rounded-full hover:bg-foreground/5"
              aria-label="Close form"
              whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 90 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X size={22} />
            </motion.button>

            {isSuccess ? (
              <SuccessState cloudkitError={cloudkitError} />
            ) : (
              <>
                {/* Header */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <h2 className="font-display text-3xl text-golden mb-2">Nominate a Business</h2>
                  <p className="text-muted-foreground text-sm">Step {step} of 4 — {FORM_STEPS[step - 1].title}</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                  {[1, 2, 3, 4].map((s) => (
                    <motion.div
                      key={s}
                      className="h-1.5 flex-1 rounded-full bg-border overflow-hidden"
                      whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                    >
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: s <= step ? '100%' : '0%' }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: easeOut }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <p className="text-destructive text-sm">{submitError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Steps */}
                <AnimatePresence mode="wait" custom={step}>
                  <motion.div
                    key={step}
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: easeOut }}
                  >
                    {step === 1 && (
                      <div className="space-y-4">
                        <FormInput
                          label="Your Name"
                          value={formData.nominatorName}
                          onChange={(v) => updateField('nominatorName', v)}
                          error={errors.nominatorName}
                          autoFocus
                        />
                        <FormInput
                          label="Your Email"
                          type="email"
                          value={formData.nominatorEmail}
                          onChange={(v) => updateField('nominatorEmail', v)}
                          error={errors.nominatorEmail}
                        />
                        <FormInput
                          label="Your Phone Number"
                          type="tel"
                          value={formData.nominatorPhone}
                          onChange={(v) => updateField('nominatorPhone', v)}
                          placeholder="Optional"
                        />
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <FormInput
                          label="Business Name"
                          value={formData.businessName}
                          onChange={(v) => updateField('businessName', v)}
                          error={errors.businessName}
                          autoFocus
                        />
                        <FormInput
                          label="Business Website or Instagram"
                          value={formData.businessWebsite}
                          onChange={(v) => updateField('businessWebsite', v)}
                          placeholder="Optional"
                        />
                      </div>
                    )}

                    {step === 3 && (
                      <FormInput
                        label="Why should this business be featured?"
                        value={formData.reason}
                        onChange={(v) => updateField('reason', v)}
                        error={errors.reason}
                        isTextarea
                        autoFocus
                        placeholder="Tell us what makes this business special to Bakersfield..."
                      />
                    )}

                    {step === 4 && (
                      <div className="space-y-4">
                        <motion.label 
                          className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-foreground/5 transition-colors"
                          whileHover={prefersReducedMotion ? {} : { x: 3 }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.99 }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.notifyBusiness}
                            onChange={(e) => updateField('notifyBusiness', e.target.checked)}
                            className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary focus:ring-offset-background accent-primary"
                          />
                          <span className="text-foreground group-hover:text-primary transition-colors">
                            Notify this business about the nomination
                          </span>
                        </motion.label>
                        
                        <AnimatePresence>
                          {formData.notifyBusiness && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: easeOut }}
                            >
                              <FormInput
                                label="Business Contact (email or phone)"
                                value={formData.businessContact}
                                onChange={(v) => updateField('businessContact', v)}
                                placeholder="Optional"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8">
                  <motion.button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-all px-3 py-2 rounded-lg hover:bg-foreground/5"
                    whileHover={prefersReducedMotion || step === 1 ? {} : { x: -3 }}
                    whileTap={prefersReducedMotion || step === 1 ? {} : { scale: 0.97 }}
                  >
                    <ChevronLeft size={20} />
                    Back
                  </motion.button>

                  {step < 4 ? (
                    <motion.button
                      onClick={handleNext}
                      className="flex items-center gap-1 golden-button px-6 py-2.5 rounded-full text-primary-foreground font-medium"
                      whileHover={prefersReducedMotion ? {} : { scale: 1.03, x: 2 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                    >
                      Next
                      <ChevronRight size={20} />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 golden-button px-6 py-2.5 rounded-full text-primary-foreground font-medium disabled:opacity-70"
                      whileHover={prefersReducedMotion || isSubmitting ? {} : { scale: 1.03 }}
                      whileTap={prefersReducedMotion || isSubmitting ? {} : { scale: 0.97 }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Submit Nomination'
                      )}
                    </motion.button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
