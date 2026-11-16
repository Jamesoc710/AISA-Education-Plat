"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Alert } from "@/components/auth/fields";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * "Check your email" screen shown after sign-up and after a reset request.
 * `resend` returns an error message to show, or null when the email went out.
 */
export function CheckEmail({
  email,
  title = "Check your email",
  children,
  resend,
  onBack,
  backLabel = "Use a different email",
}: {
  email: string;
  title?: string;
  children: React.ReactNode;
  resend: () => Promise<string | null>;
  onBack: () => void;
  backLabel?: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The form was replaced by this screen: move focus so it gets announced.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (sending || secondsLeft > 0) return;
    setSending(true);
    setNotice(null);
    const error = await resend();
    setSending(false);
    setNotice(
      error ? { tone: "error", text: error } : { tone: "info", text: `Sent again to ${email}.` },
    );
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div>
      <div className="auth-icon-badge">
        <Icon name="envelope" size={24} />
      </div>
      <h1 className="auth-title" tabIndex={-1} ref={headingRef} style={{ outline: "none" }}>
        {title}
      </h1>
      <p className="auth-sub">{children}</p>

      <div className="auth-stack">
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
        <p className="auth-foot" style={{ margin: 0 }}>
          Nothing after a minute? Check spam, or{" "}
          <button
            type="button"
            className="auth-link"
            onClick={handleResend}
            disabled={sending || secondsLeft > 0}
          >
            {sending
              ? "sending..."
              : secondsLeft > 0
                ? `resend in ${secondsLeft}s`
                : "resend the email"}
          </button>
          .
        </p>
        <p className="auth-foot" style={{ margin: 0 }}>
          <button type="button" className="auth-link" onClick={onBack}>
            {backLabel}
          </button>
        </p>
      </div>
    </div>
  );
}
