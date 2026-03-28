import { Suspense } from "react";
import { LoginClient } from "@/components/login-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — AISA Atlas",
  description: "Sign in to track your progress across AI concepts.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
