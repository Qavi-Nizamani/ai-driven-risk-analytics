import { TableCell, TableRow } from "@/components/ui/table";

interface EmptyStateProps {
  message: string;
  colSpan: number;
}

export function EmptyState({ message, colSpan }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-center text-muted-foreground py-8"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
