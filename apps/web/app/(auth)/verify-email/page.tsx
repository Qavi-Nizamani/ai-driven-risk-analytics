"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/layout/AuthCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { api, ApiError } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const prefillEmail = searchParams.get("email") ?? "";

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setReady(true);
      return;
    }

    api.auth
      .verifyEmail(token)
      .then(() => {
        router.replace("/dashboard/projects");
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
        setReady(true);
      });
  }, [router, searchParams]);

  return (
    <AuthCard title="Verifying your email" description="Incident Intelligence Platform">
      {!ready ? (
        <p className="text-sm text-muted-foreground text-center">Verifying…</p>
      ) : (
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ResendVerificationForm defaultEmail={prefillEmail} />
        </div>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Verifying your email" description="Incident Intelligence Platform">
          <p className="text-sm text-muted-foreground text-center">Verifying…</p>
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
