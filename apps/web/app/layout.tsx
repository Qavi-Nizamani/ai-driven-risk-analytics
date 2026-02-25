import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Incident Intelligence Dashboard",
  description: "Realtime incident detection and analytics dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

