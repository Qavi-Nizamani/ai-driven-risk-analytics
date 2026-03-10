"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResendVerificationFormProps {
  defaultEmail?: string;
}

export function ResendVerificationForm({ defaultEmail = "" }: ResendVerificationFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setError(null);
    setStatus("loading");
    try {
      await api.auth.resendVerification(email);
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "sent") {
    return (
      <p className="text-sm text-muted-foreground text-center">
        Verification email resent. Check your inbox.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!defaultEmail && (
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        variant="outline"
        className="w-full"
        disabled={status === "loading" || !email}
        onClick={() => void handleResend()}
      >
        {status === "loading" ? "Sending…" : "Resend verification email"}
      </Button>
    </div>
  );
}
