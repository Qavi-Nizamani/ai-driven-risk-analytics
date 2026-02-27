"use client";

import { useState } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { ApiKeyReveal } from "@/components/auth/ApiKeyReveal";
import type { SignupResult } from "@/types/session";

export default function SignupPage() {
  const [result, setResult] = useState<SignupResult | null>(null);

  if (result) {
    return <ApiKeyReveal result={result} />;
  }

  return <SignupForm onSuccess={setResult} />;
}
