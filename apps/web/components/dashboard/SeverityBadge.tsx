import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string;
}

const severityStyles: Record<string, string> = {
  CRITICAL:
    "bg-red-950 text-red-400 border-red-800 hover:bg-red-950",
  ERROR:
    "bg-orange-950 text-orange-400 border-orange-800 hover:bg-orange-950",
  WARN: "bg-yellow-950 text-yellow-400 border-yellow-800 hover:bg-yellow-950",
  INFO: "bg-green-950 text-green-400 border-green-800 hover:bg-green-950",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const key = severity.toUpperCase();
  const styles = severityStyles[key] ?? severityStyles.INFO;

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-bold tracking-wider uppercase", styles)}
    >
      {severity}
    </Badge>
  );
}
