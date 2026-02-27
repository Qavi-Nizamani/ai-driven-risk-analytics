import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  OPEN: "bg-red-950 text-red-400 border-red-800 hover:bg-red-950",
  INVESTIGATING:
    "bg-yellow-950 text-yellow-400 border-yellow-800 hover:bg-yellow-950",
  RESOLVED:
    "bg-green-950 text-green-400 border-green-800 hover:bg-green-950",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = status.toUpperCase();
  const styles = statusStyles[key] ?? "bg-secondary text-secondary-foreground";

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-bold tracking-wider uppercase", styles)}
    >
      {status}
    </Badge>
  );
}
