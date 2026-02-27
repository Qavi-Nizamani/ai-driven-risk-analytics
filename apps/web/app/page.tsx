import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Incident Intelligence Platform
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time incident detection and risk analytics.
          </p>
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
