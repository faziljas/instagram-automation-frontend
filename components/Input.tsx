import { InputHTMLAttributes, forwardRef } from 'react';

type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputType?: InputType;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, inputType = 'text', className = '', ...props }, ref) => {
    const baseStyles = 'block w-full px-4 py-3 border rounded-lg bg-[#F9FAFB] focus:outline-none transition-colors';
    const normalStyles = 'border-[#E5E7EB] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]';
    const errorStyles = 'border-red-500 focus:ring-red-500 focus:border-red-500';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
