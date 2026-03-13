import { MethodBadge } from "@/components/method-badge";
import { CodeBlock } from "@/components/code-block";
import { cn } from "@/lib/utils";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface EndpointCardProps {
  method: HttpMethod;
  path: string;
  description: string;
  auth?: "api-key" | "jwt" | "both" | "none";
  pathParams?: Param[];
  queryParams?: Param[];
  bodyParams?: Param[];
  requestExample?: string;
  responseExample?: string;
  notes?: string[];
  className?: string;
}

function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[--color-border]">
            <th className="text-left py-2 pr-4 font-medium text-[--color-muted-foreground] w-40">Name</th>
            <th className="text-left py-2 pr-4 font-medium text-[--color-muted-foreground] w-28">Type</th>
            <th className="text-left py-2 pr-4 font-medium text-[--color-muted-foreground] w-20">Required</th>
            <th className="text-left py-2 font-medium text-[--color-muted-foreground]">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-[--color-border]/60">
              <td className="py-2 pr-4">
                <code className="text-xs font-mono bg-[--color-muted] px-1.5 py-0.5 rounded border border-[--color-border]">
                  {p.name}
                </code>
              </td>
              <td className="py-2 pr-4 text-[--color-muted-foreground] font-mono text-xs">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-[--color-delete] text-xs font-medium">required</span>
                ) : (
                  <span className="text-[--color-muted-foreground] text-xs">optional</span>
                )}
              </td>
              <td className="py-2 text-[--color-foreground]/80 text-sm">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const authLabels: Record<string, string> = {
  "api-key": "API Key (X-Api-Key header)",
  jwt: "JWT Session (cookie)",
  both: "API Key or JWT Session",
  none: "Public — no auth required",
};

export function EndpointCard({
  method,
  path,
  description,
  auth = "both",
  pathParams,
  queryParams,
  bodyParams,
  requestExample,
  responseExample,
  notes,
  className,
}: EndpointCardProps) {
  return (
    <div className={cn("rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[--color-border] bg-[--color-muted]/40">
        <MethodBadge method={method} />
        <code className="text-sm font-mono font-semibold text-[--color-foreground]">{path}</code>
      </div>

      <div className="px-5 py-4 space-y-5">
        <p className="text-[--color-foreground]/80 text-sm">{description}</p>

        {/* Auth */}
        <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground]">
          <span className="font-medium uppercase tracking-wide">Auth:</span>
          <span>{authLabels[auth]}</span>
        </div>

        {/* Notes */}
        {notes && notes.length > 0 && (
          <div className="rounded-lg bg-[--color-post-bg] border border-[--color-post]/20 px-4 py-3 space-y-1">
            {notes.map((note, i) => (
              <p key={i} className="text-sm text-[--color-foreground]/80">
                {note}
              </p>
            ))}
          </div>
        )}

        {/* Path params */}
        {pathParams && pathParams.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
              Path Parameters
            </h4>
            <ParamTable params={pathParams} />
          </div>
        )}

        {/* Query params */}
        {queryParams && queryParams.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
              Query Parameters
            </h4>
            <ParamTable params={queryParams} />
          </div>
        )}

        {/* Body params */}
        {bodyParams && bodyParams.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
              Request Body
            </h4>
            <ParamTable params={bodyParams} />
          </div>
        )}

        {/* Examples */}
        {(requestExample ?? responseExample) && (
          <div className="grid gap-4 md:grid-cols-2">
            {requestExample && (
              <CodeBlock code={requestExample} filename="Request" />
            )}
            {responseExample && (
              <CodeBlock code={responseExample} filename="Response" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
