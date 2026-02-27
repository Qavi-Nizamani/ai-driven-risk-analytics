"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import type { MemberRow } from "@/types/session";

const ROLE_COLORS: Record<string, string> = {
  OWNER: "border-primary/50 bg-primary/10 text-primary",
  ADMIN: "border-accent-foreground/30 bg-accent text-accent-foreground",
  MEMBER: "border-border bg-muted text-muted-foreground",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.organizations.members().then((data) => {
      setMembers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold">Team Members</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          All members of your organization.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner rows={3} />
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Member
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Joined
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <EmptyState colSpan={4} message="No members found." />
              ) : (
                members.map((m) => (
                  <TableRow key={m.id} className="border-border">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {initials(m.user.name)}
                        </div>
                        <span className="font-medium">{m.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {m.user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${ROLE_COLORS[m.role] ?? ""}`}
                      >
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(m.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
