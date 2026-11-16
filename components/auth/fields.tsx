"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-errors";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

/** Label, control and a single line of error text, wired for screen readers. */
export function Field({
  label,
  error,
  labelAction,
  hint,
  children,
}: {
  label: string;
  error?: string | null;
  /** Small link on the label row, e.g. "Forgot password?". */
  labelAction?: ReactNode;
  hint?: ReactNode;
  children: (control: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="auth-field">
      <div className="auth-label-row">
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
        {labelAction}
      </div>
      {children({ id, describedBy: error ? errorId : undefined, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="auth-field-error" role="alert">
          {error}
        </p>
      ) : (
        hint
      )}
    </div>
  );
}

export function TextInput({
  control,
  ...props
}: InputProps & { control: { id: string; describedBy: string | undefined; invalid: boolean } }) {
  return (
    <input
      {...props}
      id={control.id}
      className="auth-input"
      aria-invalid={control.invalid || undefined}
      aria-describedby={control.describedBy}
    />
  );
}

export function PasswordInput({
  control,
  ...props
}: Omit<InputProps, "type"> & {
  control: { id: string; describedBy: string | undefined; invalid: boolean };
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        {...props}
        id={control.id}
        type={visible ? "text" : "password"}
        className="auth-input"
        aria-invalid={control.invalid || undefined}
        aria-describedby={control.describedBy}
        // Password managers and browsers should not "correct" a password.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="auth-reveal"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <Icon name={visible ? "eye-slash" : "eye"} size={18} />
      </button>
    </div>
  );
}

/** Live requirement shown under a new password. Turns green once met. */
export function PasswordRule({ password }: { password: string }) {
  const met = password.length >= MIN_PASSWORD_LENGTH;
  return (
    <p className="auth-hint" data-met={met}>
      <Icon name="check-circle" size={15} weight={met ? "fill" : "regular"} />
      At least {MIN_PASSWORD_LENGTH} characters
    </p>
  );
}

export function Alert({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  return (
    <div className="auth-alert" data-tone={tone} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "error" ? "warning" : "info"} size={17} />
      <div>{children}</div>
    </div>
  );
}

export function SubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className="auth-btn auth-btn-primary"
      disabled={loading || disabled}
      aria-busy={loading || undefined}
    >
      {loading && <span className="auth-spinner" aria-hidden />}
      {children}
    </button>
  );
}
