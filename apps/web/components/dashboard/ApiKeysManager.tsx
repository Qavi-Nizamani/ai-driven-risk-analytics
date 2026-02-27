"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/shared/CopyButton";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ApiKeyRow } from "@/types/session";
import { formatDate } from "@/lib/utils";

interface ApiKeysManagerProps {
  keys: ApiKeyRow[];
  projectId: string;
  onGenerate: (projectId: string, name: string) => Promise<string>;
  onRevoke: (id: string) => Promise<void>;
}

export function ApiKeysManager({
  keys,
  projectId,
  onGenerate,
  onRevoke,
}: ApiKeysManagerProps) {
  const [keyName, setKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setGenerating(true);
    setNewKeyValue(null);
    try {
      const key = await onGenerate(projectId, keyName.trim());
      setNewKeyValue(key);
      setKeyName("");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await onRevoke(id);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest">
          API Keys
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Use with{" "}
          <code className="text-primary/80 bg-background px-1 py-0.5 rounded text-[11px] border border-border">
            X-Api-Key
          </code>{" "}
          header on the ingestion service (port 4100).{" "}
          <span className="font-mono text-[11px]">
            Project: {projectId.slice(0, 8)}…
          </span>
        </p>
      </div>

      {/* Newly generated key banner */}
      {newKeyValue && (
        <Alert className="border-green-800 bg-green-950/30">
          <AlertTitle className="text-xs uppercase tracking-widest text-green-400 font-bold flex items-center justify-between">
            <span>New key — copy now, won&apos;t be shown again</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-green-400 hover:text-green-300 hover:bg-transparent -mt-0.5"
              onClick={() => setNewKeyValue(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription className="mt-2 flex items-center gap-2">
            <Input
              readOnly
              value={newKeyValue}
              className="font-mono text-xs bg-green-950/50 border-green-800 text-green-300"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <CopyButton value={newKeyValue} />
          </AlertDescription>
        </Alert>
      )}

      {/* Keys table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Last used
              </TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Created
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <EmptyState colSpan={4} message="No API keys yet." />
            ) : (
              keys.map((k) => (
                <TableRow key={k.id} className="border-border">
                  <TableCell className="text-xs font-medium">{k.name}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {k.lastUsedAt ? formatDate(k.lastUsedAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDate(k.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                      disabled={revoking === k.id}
                      onClick={() => void handleRevoke(k.id)}
                    >
                      {revoking === k.id ? "Revoking…" : "Revoke"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Generate new key form */}
      <form
        onSubmit={(e) => void handleGenerate(e)}
        className="flex items-center gap-2"
      >
        <Input
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder="Key name (e.g. staging-ingestor)"
          className="max-w-xs"
          required
        />
        <Button
          type="submit"
          size="sm"
          disabled={generating || !keyName.trim()}
          className="gap-1.5 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          {generating ? "Generating…" : "Generate key"}
        </Button>
      </form>
    </section>
  );
}
