/**
 * Plain-language messages for Supabase Auth errors. Raw messages
 * ("Invalid login credentials", "For security purposes, you can only
 * request this after 43 seconds") are never shown to members.
 */

type AuthErrorLike = { code?: string | null; message?: string; status?: number } | null | undefined;

export type AuthContext = "sign-in" | "sign-up" | "forgot" | "reset" | "confirm" | "resend";

const GENERIC = "Something went wrong on our end. Please try again.";

export function authErrorMessage(error: AuthErrorLike, context: AuthContext): string {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "That email and password don't match. Check them and try again.";
  }
  if (code === "email_not_confirmed") {
    return "Confirm your email first. We can send you a new link.";
  }
  if (code === "user_already_exists" || code === "email_exists") {
    return "An account with that email already exists. Sign in instead.";
  }
  if (code === "weak_password") {
    return "Choose a stronger password: at least 8 characters, and not a common one.";
  }
  if (code === "same_password") {
    return "That's your current password. Choose a new one.";
  }
  if (code === "over_email_send_rate_limit") {
    return "We've sent a lot of emails in the last few minutes. Wait a bit, then try again.";
  }
  if (code === "over_request_rate_limit" || error?.status === 429) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (code === "email_address_invalid" || code === "validation_failed") {
    return context === "sign-in"
      ? "Enter the email you signed up with."
      : "That email address doesn't look right. Check it and try again.";
  }
  if (code === "email_address_not_authorized") {
    return "We can't send email to that address. Try a different one.";
  }
  if (code === "signup_disabled") {
    return "New accounts are closed right now.";
  }
  if (code === "user_banned") {
    return "This account has been disabled. Contact a TCO lead.";
  }
  if (code === "otp_expired" || code === "flow_state_expired" || code === "flow_state_not_found") {
    return "This link has expired or was already used.";
  }
  if (code === "session_not_found" || code === "session_expired" || message.includes("session missing")) {
    return "This link has expired. Request a new one.";
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  return GENERIC;
}

/** Codes the server routes pass to /login as ?error=. Anything else is ignored. */
const LANDING_ERRORS: Record<string, string> = {
  link_failed:
    "That link didn't work in this browser. If you already confirmed your email, sign in below.",
  oauth: "Google sign-in was cancelled or didn't finish. Try again.",
  profile: "You're signed in, but we couldn't load your profile. Try again.",
};

export function landingErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return LANDING_ERRORS[code] ?? null;
}

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
