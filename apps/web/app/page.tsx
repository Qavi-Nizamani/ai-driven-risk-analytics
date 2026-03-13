import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-lg w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Incident Intelligence Platform
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time incident detection and risk analytics. Integrate in minutes.
          </p>
        </div>

        {/* Quick install teaser */}
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
            Quick start
          </p>
          <pre className="text-xs font-mono text-foreground/80 bg-background rounded border border-border px-3 py-2 overflow-x-auto">
            <span className="text-muted-foreground">$</span> npm install @vigilry/node
          </pre>
          <pre className="text-xs font-mono text-foreground/70 bg-background rounded border border-border px-3 py-2 overflow-x-auto leading-relaxed">
{`import vigilry from "@vigilry/node";

vigilry.init({ apiKey: "pk_live_..." });
vigilry.captureError(err);`}
          </pre>
          <a
            href="https://developers.vigilry.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Read the full SDK docs →
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/signup">Create account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard →</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
