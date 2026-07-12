"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { roleConfig, type UserRole } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UsersIcon, ShieldCheckIcon } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole | null;
  created_at: string;
}

export default function TeamPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const userRole = profile?.role as UserRole | undefined;

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (data) setUsers(data as Profile[]);
      setLoading(false);
    }
    fetchUsers();
  }, [supabase]);

  async function updateRole(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  }

  if (userRole !== "fleet_manager") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Only Fleet Managers can access this page.
        </p>
      </div>
    );
  }

  const unassigned = users.filter((u) => !u.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and access permissions
        </p>
      </div>

      {unassigned.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <ShieldCheckIcon className="h-5 w-5" />
              {unassigned.length} user{unassigned.length > 1 ? "s" : ""} awaiting role assignment
            </CardTitle>
            <CardDescription className="text-yellow-600 dark:text-yellow-400">
              These users signed up but haven&apos;t been assigned a role yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            All Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3 shrink-0">
                    {user.role ? (
                      <Badge variant="secondary" className={roleConfig[user.role]?.color}>
                        {roleConfig[user.role]?.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">
                        Unassigned
                      </Badge>
                    )}
                    <Select
                      value={user.role || ""}
                      onValueChange={(val) =>
                        updateRole(user.id, val as UserRole)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Assign role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleConfig) as UserRole[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleConfig[role].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
