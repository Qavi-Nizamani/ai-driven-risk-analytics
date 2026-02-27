import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProjectRow } from "@/types/session";

const ENV_COLORS: Record<string, string> = {
  PRODUCTION: "border-red-800 bg-red-950 text-red-400",
  STAGING: "border-yellow-800 bg-yellow-950 text-yellow-400",
  DEV: "border-green-800 bg-green-950 text-green-400",
};

interface ProjectHeaderProps {
  project: ProjectRow;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-7 px-2">
        <Link href="/dashboard/projects">
          <ArrowLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
      </Button>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{project.name}</h2>
        <Badge
          variant="outline"
          className={`text-[10px] ${ENV_COLORS[project.environment] ?? ""}`}
        >
          {project.environment}
        </Badge>
      </div>
    </div>
  );
}
