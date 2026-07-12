"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { canAccessPage, type UserRole } from "@/lib/rbac";

export function RBACGuard({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    const role = profile.role as UserRole;
    if (!canAccessPage(role, page)) {
      router.replace("/dashboard");
    }
  }, [profile, loading, page, router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const role = profile.role as UserRole;
  if (!canAccessPage(role, page)) return null;

  return <>{children}</>;
}
