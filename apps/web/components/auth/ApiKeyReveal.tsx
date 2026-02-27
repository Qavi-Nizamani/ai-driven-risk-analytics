"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateId } from "@/lib/utils";
import type { SignupResult } from "@/types/session";

interface ApiKeyRevealProps {
  result: SignupResult;
}

export function ApiKeyReveal({ result }: ApiKeyRevealProps) {
  const router = useRouter();

  return (
    <Card className="w-full max-w-lg bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Account created!
        </CardTitle>
        <CardDescription className="text-xs uppercase tracking-widest text-muted-foreground">
          Your account is ready
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Organization
            </p>
            <p className="text-sm font-medium">{result.organization.name}</p>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {truncateId(result.organization.id)}
          </Badge>
        </div>

        <Button
          className="w-full"
          onClick={() => router.push("/dashboard/projects")}
        >
          Go to Dashboard →
        </Button>
      </CardContent>
    </Card>
  );
}
