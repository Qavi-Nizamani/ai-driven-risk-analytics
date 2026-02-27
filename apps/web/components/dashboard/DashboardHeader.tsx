import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConnectionBadge } from "@/components/dashboard/ConnectionBadge";
import type { SessionInfo } from "@/types/session";

interface DashboardHeaderProps {
  session: SessionInfo | null;
  connected: boolean;
  onLogout: () => Promise<void>;
}

export function DashboardHeader({
  session,
  connected,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8 pb-6 border-b border-border">
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">
          Risk Analytics Dashboard
        </h1>
        {session && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{session.organization.name}</span>
            <Separator orientation="vertical" className="h-3 bg-border" />
            <span>{session.project.name}</span>
            {session.user && (
              <>
                <Separator orientation="vertical" className="h-3 bg-border" />
                <span>{session.user.email}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ConnectionBadge connected={connected} />
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => void onLogout()}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
