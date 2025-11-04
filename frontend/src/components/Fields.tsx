import { useId } from "react";
import type {
  ReactNode,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
export function Field({
  label,
  hint,
  children,
  id,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Input({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} id={id}>
      <input {...props} id={id} />
    </Field>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Field label={label} id={id}>
      <select {...props} id={id}>
        {children}
      </select>
    </Field>
  );
}
export function Textarea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} id={id}>
      <textarea {...props} id={id} rows={4} />
    </Field>
  );
}
