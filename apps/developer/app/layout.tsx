import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s — Vigilry Docs",
    default: "Vigilry Developer Documentation",
  },
  description:
    "Official developer documentation for the Vigilry Risk Engine — REST API reference and Node.js SDK guides.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <div className="max-w-4xl mx-auto px-8 py-12">{children}</div>
        </main>
      </body>
    </html>
  );
}
