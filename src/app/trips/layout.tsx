"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
