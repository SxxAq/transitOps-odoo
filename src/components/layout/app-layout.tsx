"use client";

import { AuthProvider } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { RBACGuard } from "@/components/rbac-guard";

export default function AppLayout({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 p-8">
          <RBACGuard page={page}>{children}</RBACGuard>
        </main>
      </div>
    </AuthProvider>
  );
}
