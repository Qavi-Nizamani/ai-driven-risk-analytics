import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { IncidentRow } from "@/types/session";
import { formatDate, truncateId } from "@/lib/utils";

interface IncidentsTableProps {
  incidents: IncidentRow[];
}

export function IncidentsTable({ incidents }: IncidentsTableProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest">
          Incidents
        </h2>
        <span className="text-xs text-muted-foreground">
          ({incidents.length})
        </span>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  ID
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Severity
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Summary
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.length === 0 ? (
                <EmptyState
                  colSpan={5}
                  message="No incidents yet."
                />
              ) : (
                incidents.map((incident) => (
                  <TableRow key={incident.id} className="border-border">
                    <TableCell className="text-[11px] text-muted-foreground font-mono">
                      {truncateId(incident.id)}
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={incident.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={incident.status} />
                    </TableCell>
                    <TableCell className="text-xs max-w-sm">
                      {incident.summary}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(incident.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
