import { Badge } from "@/components/ui/badge";

interface ConnectionBadgeProps {
  connected: boolean;
}

export function ConnectionBadge({ connected }: ConnectionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={
        connected
          ? "border-green-800 bg-green-950 text-green-400"
          : "border-red-800 bg-red-950 text-red-400"
      }
    >
      <span className="mr-1">{connected ? "●" : "○"}</span>
      {connected ? "Live" : "Disconnected"}
    </Badge>
  );
}
