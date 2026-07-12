"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function RBACGuard({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!profile) return;

    if (!profile.role) {
      if (pathname !== "/onboarding") {
        router.replace("/onboarding");
      }
      return;
    }

    // Dynamically import to avoid server-side issues
    import("@/lib/rbac").then(({ canAccessPage }) => {
      const role = profile.role as import("@/lib/rbac").UserRole;
      if (!canAccessPage(role, page)) {
        router.replace("/dashboard");
      }
    });
  }, [profile, loading, page, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  if (!profile.role) {
    if (pathname === "/onboarding") return <>{children}</>;
    return null;
  }

  return <>{children}</>;
}
