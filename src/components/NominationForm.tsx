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
      setErrors({});
      setSubmitError(null);
    }, 300);
  };

  // Apple-like easing
  const easeOut = [0.16, 1, 0.3, 1];

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? 40 : -40),
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction < 0 ? 40 : -40),
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95, y: prefersReducedMotion ? 0 : 10 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: easeOut }}
          className="relative z-20 w-full max-w-md mx-auto px-4"
        >
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <motion.button
              onClick={handleClose}
              className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors p-1 rounded-full hover:bg-foreground/5"
              aria-label="Close form"
              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            >
              <X size={22} />
            </motion.button>

            {isSuccess ? (
              <SuccessState />
            ) : (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="font-display text-3xl text-golden mb-2">Nominate a Business</h2>
                  <p className="text-muted-foreground text-sm">Step {step} of 4 — {FORM_STEPS[step - 1].title}</p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                  {[1, 2, 3, 4].map((s) => (
                    <motion.div
                      key={s}
                      className="h-1 flex-1 rounded-full bg-border overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: s <= step ? '100%' : '0%' }}
                        animate={{ width: s <= step ? '100%' : '0%' }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: easeOut }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
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
                    transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: easeOut }}
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
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.notifyBusiness}
                            onChange={(e) => updateField('notifyBusiness', e.target.checked)}
                            className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary focus:ring-offset-background accent-primary"
                          />
                          <span className="text-foreground group-hover:text-primary transition-colors">
                            Notify this business about the nomination
                          </span>
                        </label>
                        
                        <AnimatePresence>
                          {formData.notifyBusiness && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: easeOut }}
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
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-0 disabled:pointer-events-none transition-all"
                    whileHover={prefersReducedMotion || step === 1 ? {} : { x: -2 }}
                    whileTap={prefersReducedMotion || step === 1 ? {} : { scale: 0.98 }}
                  >
                    <ChevronLeft size={20} />
                    Back
                  </motion.button>

                  {step < 4 ? (
                    <motion.button
                      onClick={handleNext}
                      className="flex items-center gap-1 golden-button px-6 py-2.5 rounded-full text-primary-foreground font-medium transition-all"
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                    >
                      Next
                      <ChevronRight size={20} />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 golden-button px-6 py-2.5 rounded-full text-primary-foreground font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      whileHover={prefersReducedMotion || isSubmitting ? {} : { scale: 1.02 }}
                      whileTap={prefersReducedMotion || isSubmitting ? {} : { scale: 0.98 }}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
