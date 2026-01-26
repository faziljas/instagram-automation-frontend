import { HTMLAttributes } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'primary' | 'white' | 'gray';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  text?: string;
}

export function Spinner({
  size = 'md',
  variant = 'primary',
  text,
  className = '',
  ...props
}: SpinnerProps) {
  const sizeStyles: Record<SpinnerSize, string> = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
    xl: 'h-16 w-16 border-3',
  };

  const variantStyles: Record<SpinnerVariant, string> = {
    primary: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} {...props}>
      <div
        className={`animate-spin rounded-full ${sizeStyles[size]} ${variantStyles[variant]}`}
      />
      {text && <p className="mt-3 text-sm text-gray-600">{text}</p>}
    </div>
  );
}

interface FullPageSpinnerProps {
  text?: string;
}

export function FullPageSpinner({ text = 'Loading...' }: FullPageSpinnerProps) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <Spinner size="xl" text={text} />
    </div>
  );
}
