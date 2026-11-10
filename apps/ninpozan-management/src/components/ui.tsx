import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60';
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-brand text-white hover:bg-brand-deep',
    ghost: 'text-ink-soft hover:bg-paper-alt',
    danger: 'text-red-600 hover:bg-red-50',
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}

const fieldInputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export const LabeledInput = forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>
>(function LabeledInput({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      <input ref={ref} className={`${fieldInputClass} ${className}`} {...props} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const LabeledSelect = forwardRef<
  HTMLSelectElement,
  { label: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>
>(function LabeledSelect({ label, error, className = '', children, ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      <select ref={ref} className={`${fieldInputClass} ${className}`} {...props}>
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const LabeledTextarea = forwardRef<
  HTMLTextAreaElement,
  { label: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function LabeledTextarea({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      <textarea ref={ref} className={`${fieldInputClass} ${className}`} {...props} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}
