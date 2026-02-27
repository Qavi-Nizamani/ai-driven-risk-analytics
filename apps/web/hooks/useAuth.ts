"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { SessionInfo } from "@/types/session";

interface UseAuthReturn {
  session: SessionInfo | null;
  authChecked: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    void api.auth
      .me()
      .then((me) => {
        setSession(me);
        setAuthChecked(true);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
        } else {
          setAuthChecked(true);
        }
      });
  }, [router]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    router.push("/login");
  }, [router]);

  return { session, authChecked, logout };
}
