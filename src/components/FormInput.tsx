import { motion } from 'framer-motion';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  isTextarea?: boolean;
  autoFocus?: boolean;
}

export function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  isTextarea = false,
  autoFocus = false,
}: FormInputProps) {
  const inputClasses = `
    w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground
    placeholder:text-muted-foreground/50 font-body
    focus:outline-none focus:border-primary input-glow
    transition-all duration-200
    ${error ? 'border-destructive' : ''}
  `;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground/80">
        {label}
      </label>
      
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`${inputClasses} min-h-[120px] resize-none`}
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={inputClasses}
        />
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-destructive text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
