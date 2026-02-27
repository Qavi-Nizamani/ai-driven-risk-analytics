"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { useProjects } from "@/hooks/useProjects";
import { formatDate } from "@/lib/utils";
import type { ProjectCreateResult } from "@/types/session";

const ENV_COLORS: Record<string, string> = {
  PRODUCTION: "border-red-800 bg-red-950 text-red-400",
  STAGING: "border-yellow-800 bg-yellow-950 text-yellow-400",
  DEV: "border-green-800 bg-green-950 text-green-400",
};

export function ProjectsPage() {
  const { projects, loading, fetchProjects, createProject, deleteProject } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (name: string, environment?: string): Promise<ProjectCreateResult> => {
    return createProject(name, environment);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each project has its own API key and event stream.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>

      {loading && projects.length === 0 ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-lg">
          <FolderGit2 className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Create your first project to start ingesting events.
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="bg-card border-border flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold truncate">{project.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${ENV_COLORS[project.environment] ?? ""}`}
                  >
                    {project.environment}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {project.id.slice(0, 8)}…
                </p>
              </CardHeader>
              <CardContent className="pb-2 flex-1">
                <p className="text-[11px] text-muted-foreground">
                  Created {formatDate(project.createdAt)}
                </p>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 gap-1"
                  onClick={() => setDeleteTarget(project.id)}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-[11px] h-7 px-2 gap-1">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    View
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o: boolean) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All events and incidents for this project will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
