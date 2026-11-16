import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password | TCO",
  description: "Get a link emailed to reset your TCO password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
