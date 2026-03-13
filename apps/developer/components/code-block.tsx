import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, lang, filename, className }: CodeBlockProps) {
  return (
    <div className={cn("rounded-lg overflow-hidden border border-[--color-sidebar-border]", className)}>
      {(filename ?? lang) && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[--color-sidebar-bg] border-b border-[--color-sidebar-border]">
          {filename && (
            <span className="text-xs text-[--color-sidebar-fg] font-mono">{filename}</span>
          )}
          {!filename && lang && (
            <span className="text-xs text-[--color-muted-foreground] uppercase tracking-wide">{lang}</span>
          )}
        </div>
      )}
      <pre className="bg-[--color-code-bg] text-[--color-code-fg] text-sm leading-relaxed overflow-x-auto p-4 m-0">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

interface InlineCodeProps {
  children: React.ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-[--color-muted] text-[--color-foreground] font-mono text-sm border border-[--color-border]">
      {children}
    </code>
  );
}
