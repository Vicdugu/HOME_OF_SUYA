interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-300"
      >
        {label}
        {required && <span className="text-brand-red ml-1">*</span>}
        {hint && (
          <span className="ml-2 text-xs font-normal text-gray-500">{hint}</span>
        )}
      </label>

      {children}

      {error && (
        <p className="text-brand-red text-xs flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared input className — use inside a FormField */
export function inputCls(hasError?: boolean) {
  return [
    "w-full bg-surface-dark border rounded-xl px-4 py-3",
    "text-white placeholder-gray-600 text-sm",
    "focus:outline-none focus:ring-2 focus:border-transparent transition-all",
    hasError
      ? "border-brand-red focus:ring-brand-red"
      : "border-surface-border focus:ring-brand-red",
  ].join(" ");
}
