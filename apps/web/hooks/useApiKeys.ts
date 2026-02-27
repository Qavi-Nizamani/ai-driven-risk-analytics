"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { ApiKeyRow } from "@/types/session";

interface UseApiKeysReturn {
  keys: ApiKeyRow[];
  loading: boolean;
  fetchKeys: (projectId: string) => Promise<void>;
  generateKey: (projectId: string, name: string) => Promise<string>;
  revokeKey: (id: string) => Promise<void>;
}

export function useApiKeys(): UseApiKeysReturn {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const data = await api.apiKeys.list(projectId);
      setKeys(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateKey = useCallback(
    async (projectId: string, name: string): Promise<string> => {
      const data = await api.apiKeys.create(projectId, name);
      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          projectId,
          lastUsedAt: null,
          createdAt: data.createdAt,
        },
        ...prev,
      ]);
      return data.key;
    },
    [],
  );

  const revokeKey = useCallback(async (id: string) => {
    await api.apiKeys.revoke(id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  return { keys, loading, fetchKeys, generateKey, revokeKey };
}
