import type { Metadata } from "next";
import { CodeBlock, InlineCode } from "@/components/code-block";

export const metadata: Metadata = { title: "Installation — Node.js SDK" };

export default function InstallationPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[--color-muted-foreground] mb-2">
          Node.js SDK
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Installation</h1>
        <p className="text-[--color-muted-foreground] text-base leading-relaxed max-w-2xl">
          <InlineCode>@vigilry/node</InlineCode> is published to npm and supports
          Node.js 18 and above. It has zero runtime dependencies.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Package Managers</h2>
          <div className="space-y-3">
            <CodeBlock code={`npm install @vigilry/node`} filename="npm" />
            <CodeBlock code={`pnpm add @vigilry/node`} filename="pnpm" />
            <CodeBlock code={`yarn add @vigilry/node`} filename="yarn" />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Requirements</h2>
          <div className="rounded-xl border border-[--color-border] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[--color-muted] border-b border-[--color-border]">
                  <th className="text-left px-5 py-3 font-semibold text-[--color-muted-foreground]">Requirement</th>
                  <th className="text-left px-5 py-3 font-semibold text-[--color-muted-foreground]">Version</th>
                  <th className="text-left px-5 py-3 font-semibold text-[--color-muted-foreground]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                <tr>
                  <td className="px-5 py-3 font-medium">Node.js</td>
                  <td className="px-5 py-3 font-mono text-xs">≥ 18.0.0</td>
                  <td className="px-5 py-3 text-[--color-muted-foreground]">Required for native fetch() support</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium">TypeScript</td>
                  <td className="px-5 py-3 font-mono text-xs">≥ 4.7</td>
                  <td className="px-5 py-3 text-[--color-muted-foreground]">Optional — type definitions included</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium">Module format</td>
                  <td className="px-5 py-3 font-mono text-xs">CommonJS</td>
                  <td className="px-5 py-3 text-[--color-muted-foreground]">ESM interop via require/import</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Importing the SDK</h2>
          <div className="space-y-3">
            <CodeBlock
              code={`// ESM / TypeScript
import { Vigilry } from "@vigilry/node";

// CommonJS
const { Vigilry } = require("@vigilry/node");`}
              lang="typescript"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Environment Variable</h2>
          <p className="text-sm text-[--color-muted-foreground] mb-3">
            Store your API key in an environment variable. Never hardcode it in
            source code.
          </p>
          <CodeBlock code={`VIGILRY_API_KEY=vig_live_abc123def456...`} filename=".env" />
          <CodeBlock
            code={`import { Vigilry } from "@vigilry/node";

const vigilry = new Vigilry({
  apiKey: process.env.VIGILRY_API_KEY!,
});`}
            lang="typescript"
            filename="index.ts"
            className="mt-3"
          />
        </div>
      </div>
    </div>
  );
}
