"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { createClient } from "@/lib/supabase/client";
import { roleConfig, canAccessPage, type UserRole } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  Wrench,
  Fuel,
  Receipt,
  BarChart3,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", page: "dashboard", icon: LayoutDashboard },
  { label: "Vehicles", href: "/vehicles", page: "vehicles", icon: Truck },
  { label: "Drivers", href: "/drivers", page: "drivers", icon: Users },
  { label: "Trips", href: "/trips", page: "trips", icon: Navigation },
  { label: "Maintenance", href: "/maintenance", page: "maintenance", icon: Wrench },
  { label: "Fuel Logs", href: "/fuel", page: "fuel", icon: Fuel },
  { label: "Expenses", href: "/expenses", page: "expenses", icon: Receipt },
  { label: "Analytics", href: "/analytics", page: "analytics", icon: BarChart3 },
  { label: "Team", href: "/settings/team", page: "settings", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "US";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/40 bg-card/80 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            TransitOps
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1.5",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border/40 p-4 space-y-4">
        {/* User Card */}
        <div className="flex items-center gap-3 rounded-xl bg-accent/30 p-2 border border-border/30">
          <Avatar className="h-9 w-9 border border-border/40">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              {profile?.full_name || user?.email?.split("@")[0]}
            </div>
            {userRole && (
              <Badge
                variant="secondary"
                className={cn(
                  "mt-0.5 text-[10px] font-medium leading-none px-1.5 py-0.5 border border-border/50",
                  roleConfig[userRole]?.color
                )}
              >
                {roleConfig[userRole]?.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-xl border-border/40 bg-transparent hover:bg-accent"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-[1.1rem] w-[1.1rem] text-foreground transition-all duration-300" />
            ) : (
              <Sun className="h-[1.1rem] w-[1.1rem] text-foreground transition-all duration-300" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex-1 rounded-xl border-border/40 bg-transparent hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-xs"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
