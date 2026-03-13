import { cn } from "@/lib/utils";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

const styles: Record<HttpMethod, string> = {
  GET: "bg-[--color-get-bg] text-[--color-get] border border-[--color-get]/30",
  POST: "bg-[--color-post-bg] text-[--color-post] border border-[--color-post]/30",
  PATCH: "bg-[--color-patch-bg] text-[--color-patch] border border-[--color-patch]/30",
  DELETE: "bg-[--color-delete-bg] text-[--color-delete] border border-[--color-delete]/30",
  PUT: "bg-[--color-patch-bg] text-[--color-patch] border border-[--color-patch]/30",
};

interface MethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-bold tracking-wide font-mono",
        styles[method],
        className
      )}
    >
      {method}
    </span>
  );
}
