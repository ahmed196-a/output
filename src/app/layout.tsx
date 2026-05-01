import { AuthSessionProvider } from "@/components/shared/providers/auth-session-provider";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/shared/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Calling Dashboard",
  description: "Multi-tenant customer dashboard for AI calling operations."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
