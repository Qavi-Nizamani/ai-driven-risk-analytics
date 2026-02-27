import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { EventRow } from "@/types/session";
import { formatDate, truncateId } from "@/lib/utils";

interface EventsTableProps {
  events: EventRow[];
}

export function EventsTable({ events }: EventsTableProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest">Events</h2>
        <span className="text-xs text-muted-foreground">({events.length})</span>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Source
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Severity
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Correlation ID
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Payload
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  Occurred At
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <EmptyState
                  colSpan={6}
                  message="No events yet — ingest events via the API using your API key."
                />
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-border">
                    <TableCell className="text-xs font-medium">
                      {event.type}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {event.source}
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={event.severity} />
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-mono">
                      {event.correlationId
                        ? truncateId(event.correlationId, 12)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground max-w-xs truncate font-mono">
                      {JSON.stringify(event.payload)}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(event.occurredAt)}
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
