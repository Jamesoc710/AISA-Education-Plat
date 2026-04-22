import { Suspense } from "react";
import { ForgotPasswordClient } from "@/components/forgot-password-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset your password | TCO",
  description: "Get a link emailed to reset your TCO password.",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordClient />
    </Suspense>
  );
}
