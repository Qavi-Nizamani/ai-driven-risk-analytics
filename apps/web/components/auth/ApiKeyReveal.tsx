"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/shared/CopyButton";
import type { SignupResult } from "@/types/session";
import { truncateId } from "@/lib/utils";

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
          Save your API key — it won&apos;t be shown again
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* API Key box */}
        <Alert className="border-primary/40 bg-accent/30">
          <AlertTitle className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
            API Key (ingestion service)
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={result.apiKey}
                className="font-mono text-xs bg-background border-border"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <CopyButton value={result.apiKey} />
            </div>
            <p className="text-xs text-muted-foreground">
              Use as{" "}
              <code className="text-primary/80 bg-background px-1 py-0.5 rounded text-[11px]">
                X-Api-Key
              </code>{" "}
              header when calling the ingestion service (port 4100).
            </p>
          </AlertDescription>
        </Alert>

        {/* Org + Project info */}
        <div className="space-y-2">
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

          <div className="flex items-center justify-between p-3 rounded-md bg-background border border-border">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Project
              </p>
              <p className="text-sm font-medium">{result.project.name}</p>
            </div>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {truncateId(result.project.id)}
            </Badge>
          </div>
        </div>

        <Separator className="bg-border" />

        <Button
          className="w-full"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard →
        </Button>
      </CardContent>
    </Card>
  );
}
