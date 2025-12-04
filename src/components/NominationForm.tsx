import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [errors, setErrors] = useState<Partial<Record<keyof NominationPayload, string>>>({});

  const updateField = (field: keyof NominationPayload, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
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
    try {
      await submitNomination(formData);
      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
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
    }, 300);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-20 w-full max-w-md mx-auto px-4"
        >
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors"
              aria-label="Close form"
            >
              <X size={24} />
            </button>

            {isSuccess ? (
              <SuccessState />
            ) : (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="font-display text-3xl text-golden mb-2">Nominate a Business</h2>
                  <p className="text-muted-foreground text-sm">Step {step} of 4 — {FORM_STEPS[step - 1].title}</p>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2 mb-8">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        s <= step ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>

                {/* Form Steps */}
                <AnimatePresence mode="wait" custom={step}>
                  <motion.div
                    key={step}
                    custom={step}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
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
                            className="w-5 h-5 rounded border-border bg-input text-primary focus:ring-primary focus:ring-offset-background"
                          />
                          <span className="text-foreground group-hover:text-primary transition-colors">
                            Notify this business about the nomination
                          </span>
                        </label>
                        
                        {formData.notifyBusiness && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <FormInput
                              label="Business Contact (email or phone)"
                              value={formData.businessContact}
                              onChange={(v) => updateField('businessContact', v)}
                              placeholder="Optional"
                            />
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={handleBack}
                    disabled={step === 1}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
                  >
                    <ChevronLeft size={20} />
                    Back
                  </button>

                  {step < 4 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1 golden-button px-6 py-2 rounded-full text-primary-foreground font-medium transition-all hover:scale-[1.02]"
                    >
                      Next
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 golden-button px-6 py-2 rounded-full text-primary-foreground font-medium transition-all hover:scale-[1.02] disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Nomination'
                      )}
                    </button>
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
