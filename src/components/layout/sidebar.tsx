"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { roleConfig, canAccessPage, type UserRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Dashboard", href: "/dashboard", page: "dashboard", icon: "M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" },
  { label: "Vehicles", href: "/vehicles", page: "vehicles", icon: "M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM2 4a2 2 0 0 1 2-2h9l4 4v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z" },
  { label: "Drivers", href: "/drivers", page: "drivers", icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm-4 7a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" },
  { label: "Trips", href: "/trips", page: "trips", icon: "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" },
  { label: "Maintenance", href: "/maintenance", page: "maintenance", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
  { label: "Fuel Logs", href: "/fuel", page: "fuel", icon: "M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16m-8 0h8m-8 0H3m8 0h1m-6 0h5m5-14V4m0 0h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2V5z" },
  { label: "Expenses", href: "/expenses", page: "expenses", icon: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2L4 2zm3 14h10m-10-4h10m-10-4h4" },
  { label: "Analytics", href: "/analytics", page: "analytics", icon: "M18 20V10m-6 10V4m-6 16v-6" },
  { label: "Team", href: "/settings/team", page: "settings", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const userRole = profile?.role as UserRole | undefined;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  const visibleNavItems = userRole
    ? navItems.filter((item) => canAccessPage(userRole, item.page))
    : navItems;

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          TransitOps
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        {userRole && (
          <Badge
            variant="secondary"
            className={cn("mb-2 text-xs", roleConfig[userRole]?.color)}
          >
            {roleConfig[userRole]?.label}
          </Badge>
        )}
        <div className="mb-2 text-xs text-muted-foreground truncate">
          {user?.email}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
