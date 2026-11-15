'use client';
import { useId, useState, type InputHTMLAttributes } from 'react';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className="size-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
    {!visible && <line x1="3" y1="3" x2="21" y2="21" />}
  </svg>
);

const TextInput = ({
  label,
  error,
  id,
  className,
  type = 'text',
  ...props
}: TextInputProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`flex w-full max-w-sm flex-col gap-1.5 ${className ?? ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="pl-4 font-display text-sm font-black uppercase italic tracking-wide text-white [paint-order:stroke_fill] [text-shadow:0_2px_0_#6b2f00] [-webkit-text-stroke:4px_#6b2f00]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          className={`h-14 w-full rounded-xl border-4 ${error ? 'border-red-600' : 'border-[#6b2f00]'} bg-linear-to-b from-[#fde9a8] to-[#fffbea] px-6 text-lg font-bold text-[#6b2f00] shadow-[inset_0_4px_0_rgba(107,47,0,0.25),0_4px_0_#6b2f00,0_8px_10px_rgba(0,0,0,0.3)] outline-none transition-shadow placeholder:font-semibold placeholder:text-[#6b2f00]/45 focus:shadow-[inset_0_4px_0_rgba(107,47,0,0.25),0_4px_0_#6b2f00,0_0_0_6px_#ffd61f] disabled:cursor-not-allowed disabled:opacity-60 ${isPassword ? 'pr-14' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-14 cursor-pointer items-center justify-center text-[#6b2f00]/60 transition-colors hover:text-[#6b2f00]"
          >
            <EyeIcon visible={showPassword} />
          </button>
        )}
      </div>
      {error && (
        <p className="pl-4 text-sm font-bold text-red-200 [text-shadow:0_1px_0_#6b2f00]">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextInput;
