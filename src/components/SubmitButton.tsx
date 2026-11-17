"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary btn", name, value, formNoValidate }: { children: React.ReactNode; className?: string; name?: string; value?: string; formNoValidate?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} name={name} value={value} formNoValidate={formNoValidate} aria-busy={pending}>
      {children}
    </button>
  );
}
