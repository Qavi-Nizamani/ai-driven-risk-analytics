"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProjectCreateResult } from "@/types/session";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, environment?: string) => Promise<ProjectCreateResult>;
}

function CopyableKeyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={value}
          className="font-mono text-xs bg-green-950/50 border-green-800 text-green-300"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 border-green-800 text-green-400 hover:bg-green-950/50"
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "reveal">("form");
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<string>("PRODUCTION");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectCreateResult | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await onCreate(name.trim(), environment);
      setResult(res);
      setStep("reveal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setName("");
    setEnvironment("PRODUCTION");
    setError(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Project name
                </Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Service"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Environment
                </Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="DEV">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !name.trim()}>
                  {creating ? "Creating…" : "Create project"}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Project created</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="border-green-800 bg-green-950/30">
                <AlertTitle className="text-xs uppercase tracking-widest text-green-400 font-bold">
                  Save your keys — won&apos;t be shown again
                </AlertTitle>
                <AlertDescription className="mt-3 space-y-3">
                  <CopyableKeyField label="Publishable Key (SDK / client-side)" value={result?.publishableKey ?? ""} />
                  <CopyableKeyField label="Secret Key (server-side only)" value={result?.secretKey ?? ""} />
                </AlertDescription>
              </Alert>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Use the <span className="font-semibold text-foreground">publishable key</span> in{" "}
                  <code className="text-primary/80 bg-background px-1 py-0.5 rounded border border-border">@vigilry/node</code>{" "}
                  and any client-side code.
                </p>
                <p>
                  Use the <span className="font-semibold text-foreground">secret key</span> only in server environments for management API calls.
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-3 space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Next step
                </p>
                <pre className="text-[11px] font-mono text-foreground/70 overflow-x-auto leading-relaxed">
{`npm install @vigilry/node

import vigilry from "@vigilry/node";
vigilry.init({ apiKey: "pk_..." });
vigilry.captureError(err);`}
                </pre>
                <a
                  href="https://developers.vigilry.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  SDK quickstart docs →
                </a>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleClose();
                  if (result) router.push(`/dashboard/projects/${result.id}`);
                }}
              >
                Go to project →
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
