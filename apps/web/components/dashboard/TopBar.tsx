"use client";

import { usePathname } from "next/navigation";
import { ConnectionBadge } from "@/components/dashboard/ConnectionBadge";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/projects": "Projects",
  "/dashboard/members": "Team",
  "/dashboard/settings": "Settings",
};

interface TopBarProps {
  connected: boolean;
}

export function TopBar({ connected }: TopBarProps) {
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? "Dashboard";

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold">{title}</h1>
      <ConnectionBadge connected={connected} />
    </header>
  );
}
