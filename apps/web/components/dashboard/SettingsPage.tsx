"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SettingsPage() {
  const { session } = useAuth();
  const [orgName, setOrgName] = useState(session?.organization.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.organizations.updateMe({ name: orgName.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">General</CardTitle>
          <CardDescription className="text-xs">
            Update your organization details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-xs uppercase tracking-widest text-muted-foreground">
                Organization name
              </Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
            {saveSuccess && (
              <Alert className="border-green-800 bg-green-950/30">
                <AlertDescription className="text-green-400">Changes saved.</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="sm" disabled={saving || !orgName.trim()}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Plan</CardTitle>
          <CardDescription className="text-xs">
            Your current subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs border-primary/50 bg-primary/10 text-primary uppercase">
              {session?.organization.plan ?? "FREE"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {session?.organization.plan === "ENTERPRISE"
                ? "Unlimited projects, priority support, SLA guarantees"
                : session?.organization.plan === "PRO"
                ? "Up to 25 projects, advanced analytics"
                : "Up to 3 projects, community support"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-border" />

      {/* Danger zone */}
      <Card className="bg-card border-destructive/40">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs">
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Delete organization</p>
              <p className="text-[11px] text-muted-foreground">
                Permanently delete this organization and all its data.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
              disabled
            >
              Delete org
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
