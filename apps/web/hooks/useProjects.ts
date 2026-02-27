"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { ProjectRow, ProjectCreateResult } from "@/types/session";

interface UseProjectsReturn {
  projects: ProjectRow[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, environment?: string) => Promise<ProjectCreateResult>;
  updateProject: (id: string, data: { name?: string; environment?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.projects.list();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (name: string, environment?: string): Promise<ProjectCreateResult> => {
      const result = await api.projects.create(name, environment);
      setProjects((prev) => [result, ...prev]);
      return result;
    },
    [],
  );

  const updateProject = useCallback(
    async (id: string, data: { name?: string; environment?: string }) => {
      const updated = await api.projects.update(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    [],
  );

  const deleteProject = useCallback(async (id: string) => {
    await api.projects.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}
