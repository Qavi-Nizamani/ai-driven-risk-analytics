import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-screen-xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
