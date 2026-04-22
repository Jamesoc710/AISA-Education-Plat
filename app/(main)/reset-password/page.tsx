import { Suspense } from "react";
import { ResetPasswordClient } from "@/components/reset-password-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password | TCO",
  description: "Set a new password for your TCO account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
