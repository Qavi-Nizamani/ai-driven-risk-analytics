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

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "reveal">("form");
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<string>("PRODUCTION");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectCreateResult | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep("form");
    setName("");
    setEnvironment("PRODUCTION");
    setError(null);
    setResult(null);
    setCopied(false);
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
                  API key — copy now, won&apos;t be shown again
                </AlertTitle>
                <AlertDescription className="mt-2 flex items-center gap-2">
                  <Input
                    readOnly
                    value={result?.apiKey ?? ""}
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
                </AlertDescription>
              </Alert>
              <p className="text-xs text-muted-foreground">
                Use this key with the{" "}
                <code className="text-primary/80 bg-background px-1 py-0.5 rounded border border-border">
                  X-Api-Key
                </code>{" "}
                header when ingesting events.
              </p>
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
